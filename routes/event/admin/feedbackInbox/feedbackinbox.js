var fs = require('fs')
	models = require('../../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../../util')
	, event = require('../../event')
	, async = require('async')
	, topic = require('./topic')
	, messages = require('./messages')
	, cards = require('./cards')
	, profiles = require('./profiles')
	, wall = require('./wall')
	, transport = require('../../../../config').transport
	, check = require('validator').check

exports.router = function (app) {
	var base = '/event/:id/admin/feedback/:fid/inbox';
	
	app.all(base+'/*', populateInbox)
		.get(base, populateInbox, show)
		.post(base+'/takeover', takeoverFP)
		.post(base+'/sendInbox', sendInbox)
	
	messages.router(app)
	cards.router(app)
	profiles.router(app)
	wall.router(app)
	topic.router(app)
}

function populateInbox (req, res, next) {
	if (!res.locals.feedbackProfile) {
		res.redirect('back')
		return;
	}
	
	var u = res.locals.feedbackProfile.user;
	
	async.parallel([
		function(cb) {
			models.Topic.find({ $and: [{ users: u._id }] }).sort('-lastUpdated').populate('users').exec(function(err, topics) {
				var messages = []
				for (var i = 0; i < topics.length; i++) {
					messages[i] = {
						//lastMessage: ....
						topic: topics[i]
					}
				}
				async.each(messages, function(message, done) {
					models.Message.findOne({ topic: message.topic._id }).sort('-timeSent').exec(function(err, msg) {
						if (err) throw err;
						
						message.lastMessage = msg; //msg can be null!
						done(null)
					})
				}, function(err) {
					res.locals.messages = messages;
					cb(null)
				})
			});
		},
		function(cb) {
			u.populate('receivedCards.user receivedCards.card', function(err) {
				if (err) throw err;
				
				cb(null)
			})
		},
		function(cb) {
			models.User.find({ savedProfiles: u._id }).exec(function(err, savers) {
				res.locals.savers = savers;
				cb(null)
			});
		},
		function (cb) {
			req.user.mailboxUnread = 0;
			req.user.save();
			cb(null)
		}
	], function(err) {
		if (err) throw err;
		
		next()
	})
}

function show (req, res) {
	res.format({
		html: function() {
			res.locals.topics = res.locals.messages;
			res.render('event/admin/feedbackInbox/all', { pageName: "Inbox Dashboard", title: "Inbox" });
		},
		json: function() {
			res.send({
				topics: topics
			})
		}
	})
}

function emailOrUser (req, res, next) {
	var email = req.body.field
		, u = res.locals.feedbackProfile.user
		, user = req.user
		, messages = res.locals.messages
		, uid;
	
	try {
		uid = mongoose.Types.ObjectId(req.body.field)
	} catch (e) {
		uid = null;
	}
	
	var complete = function (email, user) {
		try {
			check(email).isEmail();
		} catch (e) {
			res.send({
				status: 405,
				message: "Person has no email or email is malformed"
			})
			return;
		}
		
		next(email, user);
	}
	
	if (uid) {
		models.User.findById(uid, function(err, userToEmail) {
			if (err || !userToEmail) {
				res.send({ status: 404 })
				return;
			}
			
			complete(userToEmail.email, userToEmail);
		})
	} else {
		complete(email)
	}
}
function takeoverFP (req, res) {
	var u = res.locals.feedbackProfile.user
		, user = req.user;
	
	function complete(request, email, sendEmail) {
		if (sendEmail) {
			var options = {
				from: "EventMost <notifications@eventmost.com>",
				to: email,
				subject: "Invite to Take Over a Feedback Profile",
				html: "<img src=\"http://eventmost.com/images/logo.svg\">\
	<br/><br/><p><strong>"+user.getName()+" has sent you a request to take over a feedback profile "+u.getName()+"</strong>\
	<br/>To complete the transfer, please click <a href=\"http://eventmost.com/inbox\">here</a>, or just log in to EventMost and go to your inbox..\
	<br/>If you don't have an account on EventMost, please click <a href=\"http://eventmost.com/takeProfile/"+request._id+"/"+request.secret+"\">here</a>\
	<br/><br/>\
	Please do not reply to this email, because we are super popular and probably won't have time to read it..."
			}
			transport.sendMail(options, function(err, response) {
				if (err) throw err;
	
				console.log("Email sent.."+response.message)
			})

			// Record that an email was sent
			var emailNotification = new models.EmailNotification({
				to: u._id,
				email: email,
				type: "sentInvite"
			})
			emailNotification.save(function(err) {
				if (err) throw err;
			});
		}
		
		res.send({
			status: 200,
			message: "Done"
		})
	}
	
	emailOrUser(req, res, function(email, user) {
		if (!user) {
			request = new models.UserTakeoverRequest({
				email: email,
				requestedBy: req.user._id,
				event: res.locals.ev._id,
				takeoverUser: u._id
			})
			request.generateSecret();
			request.save(function(err) {
				if (err) throw err;
			});
			
			complete(request, email, true)
			return;
		}
		
		models.UserTakeoverRequest.findOne({
			takeoverUser: u._id,
			active: true
		}, function(err, request) {
			if (err != null || request == null) {
				request = new models.UserTakeoverRequest({
					user: user._id,
					requestedBy: req.user._id,
					event: res.locals.ev._id,
					takeoverUser: u._id
				})
				request.generateSecret();
				request.save(function (err) {
					if (err) throw err;
				});
				
				complete(request, email, true);
			} else {
				complete(request, email, false);
			}
		})
	})
}
function sendInbox (req, res) {
	emailOrUser(req, res, function(email) {
		sendInboxToEmail(req, res, email);
	})
}

function sendInboxToEmail (req, res, email) {
	var u = res.locals.feedbackProfile.user
		, user = req.user
		, messages = res.locals.messages;
	
	async.map(messages, function(message, cb) {
		models.Message.find({
			topic: message.topic._id
		}).populate('sentBy')
		  .sort('-timeSent').exec(function(err, messages) {
			if (err) throw err;
			
			var contents = "";
			for (var i = 0; i < messages.length; i++) {
				contents += "<tr>\
<td><a href=\"http://eventmost.com/user/"+messages[i].sentBy._id+"\">"+messages[i].sentBy.getName()+"</a></td>\
<td>"+messages[i].timeSent+"</td>\
<td>"+messages[i].message+"</td>\
</tr>";
			}
			
			var body = "\
<table>\
<thead>\
<tr>\
<td>From</td>\
<td>Time</td>\
<td>Content</td>\
</tr>\
</thead>\
<tbody>\
"+contents+"\
</tbody>\
</table>";
			
			cb(null, body)
		})
	}, function(err, bodies) {
		var options = {
			from: "EventMost <notifications@eventmost.com>",
			to: email,
			subject: u.getName()+"'s Inbox",
			html: "<img src=\"http://eventmost.com/images/logo.svg\">\
<br/><br/><p><strong>"+user.getName()+" is sending you Inbox of a feedback profile "+u.getName()+"</strong>\
<br/><br/><hr/>\
<h1>Private Messages</h1><br/>\
"+bodies.join('<br/>')+"<br/><hr/></br>\
Please do not reply to this email, because we are super popular and probably won't have time to read it..."
		}
		transport.sendMail(options, function(err, response) {
			if (err) throw err;
	
			console.log("Email sent.."+response.message)
		})

		// Record that an email was sent
		var emailNotification = new models.EmailNotification({
			to: u._id,
			email: email,
			type: "sentInbox"
		})
		emailNotification.save(function(err) {
			if (err) throw err;
		});
		
		res.send({
			status: 200,
			message: "Done"
		})
	})
}
