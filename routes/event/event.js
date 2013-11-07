var dropbox = require('./dropbox')
	, add = require('./add')
	, edit = require('./edit')
	, list = require('./list')
	, util = require('../../util')
	, conversations = require('./conversations')
	, attendees = require('./attendees')
	, models = require('../../models')

exports.router = function (app) {
	//app.get('/event/:id/registrationpage', getEvent, attending, viewRegistrationPage)
	//app.get('/event/:id/*', redirectToRegistrationPage)
	
	app.all('/event/*', util.authorized)
	add.router(app)
	
	app.all('/event/:id/*', getEvent)
		.get('/event/:id', getEvent, attending, viewEvent)
		
		.post('/event/:id/post', attending, postMessage)
		.get('/event/:id/conversations', attending, conversations.display)
		
		.get('/event/:id/registrationpage', attending, viewRegistrationPage)
	
	attendees.router(app)
	list.router(app)
	dropbox.router(app)
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
	var theAttendee;
	
	if (res.locals.loggedIn) {
		for (var i = 0; i < ev.attendees.length; i++) {
			var attendee = ev.attendees[i];
		
			if (typeof attendee.user === "object" && attendee.user._id.equals(req.user._id)) {
				attending = true;
				isAdmin = attendee.admin;
				theAttendee = attendee;
				break;
			}
		}
	}
	
	res.locals.eventattending = attending;
	res.locals.eventadmin = isAdmin;
	res.locals.attendee = theAttendee;
	
	next()
}

function redirectToRegistrationPage (req, res, next) {
	if (req.user) {
		next();
	} else {
		res.redirect('/event/'+req.params.id+"/registrationpage")
	}
}

function viewEvent (req, res) {
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

function viewRegistrationPage (req, res) {
	res.format({
		html: function() {
			res.render('event/landingpage', { title: res.locals.ev.name });
		}
	});
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