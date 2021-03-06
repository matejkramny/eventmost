var mongoose = require('mongoose')
	, messages = require('./messages')
	, models = require('../../models')
	, io = require('../../app').io // has to fetch it
	, async = require('async')

// the app doesn't immediately have the socket property available.. perhaps it would after 500ms
setTimeout(function() {
	io = require('../../app').io;
}, 500)

exports.socket = function (sock) {
	sock.on('register event.comments', registerEventComments)
}

function registerEventComments (data) {
	var sock = this;
	var user = sock.handshake.user;
	var ev = data.event;

	if (!ev) {
		return;
	}
	
	try {
		ev = mongoose.Types.ObjectId(ev);
	} catch (e) {
		return;
	}
	
	// check if event exists, and if the socket has access to it..
	models.Event.getEvent(data.event, function(ev) {
		if (!ev) { return; }
		
		var attending = false;
		var isAdmin = false;
		var theAttendee;

		if (!user) { return; }
		
		//console.log(user);

		for (var i = 0; i < ev.attendees.length; i++) {
			var attendee = ev.attendees[i];
			
			if (typeof attendee.user === "object" && attendee.user._id.equals(user._id)) {
				attending = true;
				isAdmin = attendee.admin;
				theAttendee = attendee;
				break;
			}
		}
		
		if (!attending) {
			return;
		}
		
		sock.set('event', ev._id);
		sock.set('eventattending', attending);
		sock.set('eventadmin', isAdmin);
		sock.set('attendee', theAttendee._id);
	}, true)
}

function getSocket (ev, cb) {
	var sockets = io.sockets.clients();
	
	async.filter(sockets, function(socket, cb) {
		socket.get('event', function(err, value) {
			if (err || !value) return;
			
			cb(ev._id.equals(value))
		})
	}, function (socks) {
		cb(socks);
	})
}

exports.notifyComment = function (ev, msg, cb) {
	getSocket(ev, function(sockets) {
		async.each(sockets, function(socket, cb) {
			socket.emit('comment', msg);
		});
		
		cb(sockets)
	})
}

exports.notifyLike = function (ev, comment, attendee, cb) {
	getSocket(ev, function(sockets) {
		async.each(sockets, function(socket, cb) {
			socket.emit('like', {
				comment: comment._id,
				attendee: {
					user: {
						_id: attendee.user._id,
						name: attendee.user.name,
						surname: attendee.user.surname
					}
				},
			})
		});
		
		cb(sockets)
	})
}
