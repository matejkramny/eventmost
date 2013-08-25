var dropbox = require('./dropbox')
	, add = require('./add')
	, edit = require('./edit')
	, list = require('./list')
	, util = require('../../util')
	, notifications = require('./notifications')

exports.router = function (app) {
	app.get('/event/add', util.authorized, add.addEvent)
		.post('/event/add', util.authorized, add.doAddEvent)
		
		.get('/event/:id', util.authorized, getEvent, attending, exports.viewEvent)
		.get('/event/:id/edit', util.authorized, getEvent, attending, edit.editEvent)
		.post('/event/:id/edit', util.authorized, getEvent, edit.doEditEvent)
		.get('/event/:id/delete', util.authorized, getEvent, edit.deleteEvent)
		.post('/event/:id/join', util.authorized, getEvent, exports.joinEvent)
		.get('/event/:id/attendees', util.authorized, getEvent, attending, list.listAttendees)
		.get('/event/:id/speakers', util.authorized, getEvent, attending, list.listSpeakers)
		.get('/event/:id/dropbox', util.authorized, getEvent, attending, dropbox.view)
		.post('/event/:id/dropbox/upload', util.authorized, getEvent, dropbox.doUpload)
		.post('/event/:id/dropbox/remove', util.authorized, getEvent, dropbox.doRemove)
		.post('/event/:id/post', util.authorized, getEvent, postMessage)
		.get('/event/:id/notifications', util.authorized, getEvent, attending, notifications.display)
		
		.get('/events', list.listEvents)
		.get('/events/my', util.authorized, list.listMyEvents)
		.get('/events/near', list.listNearEvents)
}

// Middleware to get :id param into res.local
function getEvent (req, res, next) {
	var id = req.params.id;
	
	if (!id) {
		res.format({
			html: function() {
				res.redirect('/events');
			},
			json: function() {
				res.send({
					status: 403,
					message: "No ID"
				})
			}
		})
		return;
	}
	
	models.Event.getEvent(id, function(ev) {
		if (!ev) {
			res.format({
				html: function() {
					req.session.flash.push("Event not found");
					res.redirect('/');
				},
				json: function() {
					res.send({
						status: 404,
						message: "Event not found"
					})
				}
			})
			return;
		}
		
		res.locals.event = ev;
		
		next()
	})
}

exports.attending = attending = function (req, res, next) {
	var ev = res.locals.event;
	
	var attending = false;
	if (ev.user && ev.user._id.equals(req.user._id)) {
		// owns the event, no need to search if the user is attending
		attending = true;
	} else {
		for (var i = 0; i < ev.attendees.length; i++) {
			if (ev.attendees[i]._id.equals(req.user._id)) {
				attending = true;
				break;
			}
		}
	}
	
	res.locals.attending = attending;
	
	next()
}

exports.viewEvent = function (req, res) {
	res.format({
		html: function() {
			res.render('event/view');
		},
		json: function() {
			res.send({
				event: res.locals.event,
				attending: res.locals.attending
			});
		}
	});
}

exports.joinEvent = function (req, res) {
	var password = req.body.password;
	
	var ev = res.locals.event;
	if (ev.password.enabled) {
		if (ev.password.password == password) {
			// join event.
			ev.attendees.push(req.user._id);
		} else {
			// display flash stating they got the password wrong.
			req.session.flash.push("Event password incorrect.")
		}
	} else {
		// join event.
		ev.attendees.push(req.user._id);
	}
	
	ev.save(function(err) {
		if (err) throw err;
		res.redirect('/event/'+ev._id);
	});
}

function postMessage (req, res) {
	var message = req.body.message;
	var ev = res.locals.event;
	
	if (res.locals.attending) {
		ev.messages.unshift({
			posted: Date.now(),
			user: req.user._id,
			upVote: 0,
			downVote: 0,
			message: message
		});
		ev.save(function(err) {
			if (err) throw err;
			
			res.format({
				html: function() {
					res.redirect('/event/'+ev._id);
				},
				json: function() {
					res.send({
						status: 200,
						message: "Sent"
					})
				}
			})
		})
	} else {
		res.format({
			html: function() {
				req.session.flash.push("Cannot post because you are not attending")
				res.redirect('/event/'+ev._id);
			},
			json: function() {
				res.send({
					status: 403,
					message: "Cannot post"
				})
			}
		})
	}
}