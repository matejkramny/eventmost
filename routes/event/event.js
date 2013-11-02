var dropbox = require('./dropbox')
	, add = require('./add')
	, edit = require('./edit')
	, list = require('./list')
	, util = require('../../util')
	, conversations = require('./conversations')

exports.router = function (app) {
	app.all('/event/*', util.authorized)
		.get('/event/add', add.addEvent)
		.post('/event/add', add.doAddEvent)
		.post('/event/add/avatar', add.uploadAvatarAsync)
		.get('/event/:avatarid/avatar/remove', add.removeAvatar)
		
		.all('/event/:id', getEvent)
		.all('/event/:id/*', getEvent)
		.get('/event/:id', attending, exports.viewEvent)
		.get('/event/:id/edit', attending, edit.editEvent)
		.post('/event/:id/edit', edit.doEditEvent)
		.get('/event/:id/delete', edit.deleteEvent)
		.post('/event/:id/join', exports.joinEvent)
		.get('/event/:id/attendees', attending, list.listAttendees)
		.get('/event/:id/dropbox', attending, dropbox.view)
		.post('/event/:id/dropbox/upload', attending, dropbox.doUpload)
		.post('/event/:id/dropbox/remove', dropbox.doRemove)
		.post('/event/:id/post', attending, postMessage)
		.get('/event/:id/conversations', attending, conversations.display)
		.get('/event/:id/registrationpage', attending, exports.viewRegistrationPage)
		
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
		
		res.locals.ev = ev;
		
		next()
	})
}

exports.attending = attending = function (req, res, next) {
	var ev = res.locals.ev;
	
	var attending = false;
	var isAdmin = false;
	for (var i = 0; i < ev.attendees.length; i++) {
		var attendee = ev.attendees[i];
		
		if (typeof attendee.user === "object" && attendee.user._id.equals(req.user._id)) {
			attending = true;
			isAdmin = attendee.admin;
			break;
		}
	}
	
	res.locals.eventattending = attending;
	res.locals.eventadmin = isAdmin;
	
	next()
}

exports.viewEvent = function (req, res) {
	res.format({
		html: function() {
			if (res.locals.eventattending) {
				res.render('event/homepage', { title: res.locals.ev.name });
			} else {
				res.render('event/landingpage', { title: res.locals.ev.name });
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
			res.render('event/landingpage', { title: res.locals.ev.name });
		}
	});
}

exports.joinEvent = function (req, res) {
	var password = req.body.password;
	var category = req.body.category;
	
	var ev = res.locals.ev;
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