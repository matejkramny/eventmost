var dropbox = require('./dropbox')
	, add = require('./add')
	, edit = require('./edit')
	, list = require('./list')
	, util = require('../../util')
	, conversations = require('./conversations')

exports.router = function (app) {
	app.get('/event/add', util.authorized, add.addEvent)
		.post('/event/add', util.authorized, add.doAddEvent)
		.post('/event/add/avatar', util.authorized, add.uploadAvatarAsync)
		.get('/event/:avatarid/avatar/remove', util.authorized, add.removeAvatar)
		
		.get('/event/:id', util.authorized, getEvent, attending, exports.viewEvent)
		.get('/event/:id/edit', util.authorized, getEvent, attending, edit.editEvent)
		.post('/event/:id/edit', util.authorized, getEvent, edit.doEditEvent)
		.get('/event/:id/delete', util.authorized, getEvent, edit.deleteEvent)
		.post('/event/:id/join', util.authorized, getEvent, exports.joinEvent)
		.get('/event/:id/attendees', util.authorized, getEvent, attending, list.listAttendees)
		.get('/event/:id/dropbox', util.authorized, getEvent, attending, dropbox.view)
		.post('/event/:id/dropbox/upload', util.authorized, getEvent, attending, dropbox.doUpload)
		.post('/event/:id/dropbox/remove', util.authorized, getEvent, dropbox.doRemove)
		.post('/event/:id/post', util.authorized, getEvent, attending, postMessage)
		.get('/event/:id/conversations', util.authorized, getEvent, attending, conversations.display)
		.get('/event/:id/registrationpage', util.authorized, getEvent, attending, exports.viewRegistrationPage)
		
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
			var attendee = ev.attendees[i];
			
			if (typeof attendee.user === "object" && attendee.user._id.equals(req.user._id)) {
				attending = true;
				break;
			}
		}
	}
	
	console.log("Attending:"+attending)
	
	res.locals.eventattending = attending;
	
	next()
}

exports.viewEvent = function (req, res) {
	res.format({
		html: function() {
			if (res.locals.eventattending) {
				res.render('event/homepage', { title: res.locals.event.name });
			} else {
				res.render('event/landingpage', { title: res.locals.event.name });
			}
		},
		json: function() {
			res.send({
				event: res.locals.event,
				attending: res.locals.eventattending
			});
		}
	});
}

exports.viewRegistrationPage = function (req, res) {
	res.format({
		html: function() {
			res.render('event/landingpage', { title: res.locals.event.name });
		}
	});
}

exports.joinEvent = function (req, res) {
	var password = req.body.password;
	var category = req.body.category;
	
	var ev = res.locals.event;
	var attendee = {
		user: req.user._id
	};
	
	if (ev.accessRequirements.password) {
		if (ev.accessRequirements.passwordString != password) {
			// display flash stating they got the password wrong.
			res.format({
				html: function() {
					req.session.flash.push("Event password incorrect.")
					res.redirect('/event/'+ev._id);
				},
				json: function() {
					res.send({
						status: 400,
						message: "Event password incorrect"
					})
				}
			});
			return;
		}
	}
	
	if (category && category.length > 0) {
		// Check if category exists & is valid
		var foundCategory = false;
		for (var i = 0; i < ev.categories.length; i++) {
			if (category == ev.categories[i]) {
				// Good
				foundCategory = true;
				break;
			}
		}
		
		if (foundCategory) {
			attendee.category = category;
		} else {
			// reject
			// display flash stating they got the password wrong.
			res.format({
				html: function() {
					req.session.flash.push("An Invalid category selected.")
					res.redirect('/event/'+ev._id);
				},
				json: function() {
					res.send({
						status: 400,
						mesage: "An Invalid category selected."
					})
				}
			})
			return;
		}
	}
	
	ev.attendees.push(attendee);
	ev.save(function(err) {
		if (err) throw err;
	});
	res.format({
		html: function() {
			res.redirect('/event/'+ev._id);
		},
		json: function() {
			res.send({
				status: 200
			})
		}
	})
}

function postMessage (req, res) {
	var message = req.body.message;
	var ev = res.locals.event;
	
	if (res.locals.eventattending) {
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