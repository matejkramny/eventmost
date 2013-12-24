var dropbox = require('./dropbox')
	, add = require('./add')
	, edit = require('./edit')
	, list = require('./list')
	, util = require('../../util')
	, messages = require('./messages')
	, attendees = require('./attendees')
	, models = require('../../models')
	, admin = require('./admin/admin')
	, moment = require('moment')
	, socket = require('./socket')

exports.router = function (app) {
	add.router(app)
	
	app.get('/event/:id/registrationpage', getEvent, attending, viewRegistrationPage)
		.get('/event/:id', redirectToRegistrationPage)
		.get('/event/:id/*', redirectToRegistrationPage)
	
		.all('/event/*', util.authorized)
	
		.all('/event/:id/*', getEvent, attending)
		.get('/event/:id/*', logImpression)
		.get('/event/:id', getEvent, attending, logImpression, viewEvent)
		
		.post('/event/:id/post', postMessage)
		
		.get('/event/:id/registrationpage', viewRegistrationPage)
	
	edit.router(app)
	messages.router(app)
	attendees.router(app)
	list.router(app)
	dropbox.router(app)
	admin.router(app)
}

exports.socket = function (sock) {
	socket.socket(sock);
}

function logImpression (req, res, next) {
	var ev = res.locals.ev;
	var attendee = res.locals.attendee
	var attending = res.locals.eventattending
	var admin = res.locals.eventadmin
	
	// log impression
	var impression = new models.EventStat({
		event: ev._id,
		location: req.url,
		type: "impression",
		attending: attending,
		isAdmin: admin
	})
	if (attendee) {
		impression.attendee = attendee._id
	}
	impression.save()
	
	next()
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
		
		req.session.recentEvent = ev._id;
		
		if (ev.name.length > 15) {
			req.session.recentEventName = ev.name.substring(0, 14) + "..."
		} else {
			req.session.recentEventName = ev.name;
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
	
	if (res.locals.loggedIn && req.user) {
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
		req.session.redirectAfterLogin = "/event/"+req.params.id+"/registrationpage#openAttend";
		res.redirect('/event/'+req.params.id+"/registrationpage")
	}
}

function viewEvent (req, res) {
	res.format({
		html: function() {
			res.locals.hideArrow = true;
			res.locals.moment = moment;
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
	if (!req.user && !req.session.redirectAfterLogin) {
		req.session.redirectAfterLogin = "/event/"+req.params.id+"/registrationpage";
	}
	
	res.format({
		html: function() {
			res.locals.moment = moment;
			if (!res.locals.eventattending)
				res.locals.hideArrow = true;
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