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
	, config = require('../../config')
	, mongoose = require('mongoose')
	, async = require('async')

exports.router = function (app) {
	add.router(app)

	app.get('/event/:id/registrationpage/:edit', getEvent, attending, viewRegistrationPage)
		.get('/event/:id/tickets', getEvent, attending, viewTickets)
		.get('/event/:id', redirectToRegistrationPage)
		.get('/event/:id/*', redirectToRegistrationPage)
	
		.all('/event/*', util.authorized)
		
		.all('/event/:id/*', getEvent, attending)
		.get('/event/:id/*', logImpression)
		.get('/event/:id', getEvent, attending, logImpression, viewEvent)
		
		.get('/event/:id/tickets', getEvent, viewTickets)
		.post('/event/:id/post', postMessage)
		
		.get('/event/:id/registrationpage/:edit', viewRegistrationPage)
		.get('/eventavatar/:id', getEventAvatar)
	
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

function getEventAvatar(req, res) {
	
	models.Avatar.findById(req.params.id)
	.exec(function(err, avatar) {
		if (err) throw err;
		if (avatar) {
			res.format({
				json: function() {
					res.send({
						avatar: avatar.url
					});
				}
			});		
		}
	});	
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
	
	try {
		id = mongoose.Types.ObjectId(id);
	} catch (e) {
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
	
	var arrange = req.query.arrange;
	if (!arrange || !(arrange == 'default' || arrange == 'category' || arrange == 'alphabetical' || arrange == 'recent')) {
		arrange = 'default';
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
		
		// sort the attendees
		switch(arrange) {
			default:
			case 'category':
				ev.attendees.sort(function (a, b) {
					var aIndex = -1;
					var bIndex = -1;
	
					for (var i = 0; i < ev.categories.length; i++) {
						if (ev.categories[i] == a.category) {
							aIndex = i;
						}
						if (ev.categories[i] == b.category) {
							bIndex = i;
						}
					}
	
					if (aIndex > bIndex)
						return 1;
					if (aIndex < bIndex)
						return -1;
	
					return 0;
				})
				break;
			case 'alphabetical':
				ev.attendees.sort(ev.arrangeFunctionAlphabetical);
				break;
			case 'recent':
				ev.attendees.reverse()
				break;
		}
		
		req.session.recentEvent = ev._id;
		
		if (ev.name.length > 15) {
			req.session.recentEventName = ev.name.substring(0, 14) + "..."
		} else {
			req.session.recentEventName = ev.name;
		}
		
		res.locals.ev = ev;
		//console.log(ev)
	
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
	
	if (res.locals.loggedIn && req.user) {
		models.Event.findById(ev._id).select('attendees').populate({
			path: 'attendees',
			match: { isAttending: false, user: req.user._id }
		}).exec(function(err, event) {
			if (err || !event) {
				next()
				return;
			}
			
			if (event.attendees.length > 0) {
				res.locals.attendeeRegistered = true;
				res.locals.attendee = event.attendees[0];
			}
			
			next()
		})
	} else {
		next()
	}
}

function redirectToRegistrationPage (req, res, next) {
	//console.log('abc');
	if (req.user) {
		next();
	} else {
		req.session.redirectAfterLogin = "/event/"+req.params.id+"/registrationpage/edit#openAttend";
		res.redirect('/event/'+req.params.id+"/registrationpage/edit")
	}
}

function viewEvent (req, res) {
	res.locals.hideArrow = true;
	res.locals.moment = moment;
	res.locals.stripe_key = config.credentials.stripe.pub;

	if (redirectToForeignEvent(req, res, '')) {
		return;
	}
	
	if (res.locals.eventattending) {
		res.locals.attendees = [];
		async.reject(res.locals.ev.attendees, function(attendee, cb) {
			cb(!res.locals.eventadmin && attendee.hidden);
		}, function(attendees) {
			res.locals.attendees = attendees;
			res.locals.eventStartFormatted = res.locals.ev.getStartDateFormatted();
			//console.log(res.locals.eventStartFormatted);
			res.locals.eventEndFormatted = res.locals.ev.getEndDateFormatted();
			res.render('event/homepage', { title: res.locals.ev.name });
		})
	} else {
		if (config.production && res.locals.ev.tickets.length > 0 && res.locals.is_https != true) {
			res.redirect('https://'+req.host+'/event/'+res.locals.ev._id);
			return;
		}
		
		res.locals.eventStartFormatted = res.locals.ev.getStartDateFormatted();
		//res.locals.eventEndFormatted = res.locals.ev.getEndDateCombinedFormatted();		
		res.locals.eventEndFormatted = res.locals.ev.getEndDateFormatted();
		res.render('event/landingpage', { title: res.locals.ev.name });
	}
}

function redirectToForeignEvent (req, res, page) {
	if (typeof page === 'undefined') { page = 'registrationpage' };
	
	var ev = res.locals.ev;
	if (res.locals.loggedIn && req.query.redirect == '1' && ev.isForeign()) {
		attendees.isReallyAttending(ev, req.user, function(err, attendee) {
			if (attendee == null) {
				// Automatically attend this event, and redirect to a social page..
				//attendees.addAttendee(ev, req.user, true);
				
				var url = 'https://';
				if (ev.source.eventbrite) {
					url += 'eventbrite.com/e/';
				} else if (ev.source.facebook) {
					url += 'facebook.com/events/';
				} else if (ev.source.meetup) {
					url += 'meetup.com/e/';
				}
				url += ev.source.id;

				if (ev.source.url) {
					url = ev.source.url;
				}
				
				res.redirect(url);
			} else {
				// Redirect without the ?redirect=1
				res.redirect('/event/'+res.locals.ev._id+'/'+page)
			}
		});
		
		return true;
	}
	
	return false;
}

function viewRegistrationPage (req, res) {

	//console.log("ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss");

	if (!req.user && !req.session.redirectAfterLogin) {
		req.session.redirectAfterLogin = "/event/"+req.params.id+"/registrationpage";
		console.log("through viewRegistrationPage");
	}
	
	var ev = res.locals.ev;
	if (redirectToForeignEvent(req, res, 'registrationpage')) {
		return;
	}
	
	res.format({
		html: function() {
			res.locals.stripe_key = config.credentials.stripe.pub;
			
			if (config.production && res.locals.ev.tickets.length > 0 && res.locals.is_https != true) {
				res.redirect('https://'+req.host+'/event/'+res.locals.ev._id+'/registrationpage');
				return;
			}
			
			res.locals.eventStartFormatted = res.locals.ev.getStartDateFormatted();
			//res.locals.eventEndFormatted = res.locals.ev.getEndDateCombinedFormatted();
			res.locals.eventEndFormatted = res.locals.ev.getEndDateFormatted();
			
			if (!res.locals.eventattending)
				res.locals.hideArrow = true;
			res.render('event/landingpage', { title: res.locals.ev.name, edit: req.params.edit });
		}
	});
}

function viewTickets (req, res) {
	res.send({
		tickets: res.locals.ev.tickets
	})
}

function postMessage (req, res) {
	var message = req.body.message;
	var ev = res.locals.event;
	
	models.Event.findById(ev._id, function(err, ev) {
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
	})
}