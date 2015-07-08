var dropbox = require('./apidropbox')
	, add = require('./apiadd')
	, edit = require('./apiedit')
	, list = require('./apilist')
	, util = require('../../util')
	, messages = require('./apimessages')
	, attendees = require('./apiattendees')
	, models = require('../../../../models')
	, admin = require('./apiadmin/apiadmin')
	, moment = require('moment')
	, socket = require('./apisocket')
	, config = require('../../../../config')
	, mongoose = require('mongoose')
	, async = require('async')
	, gm = require('gm')
	, fs = require('fs')

exports.router = function (app) {
	add.router(app)
	
	/*app.get('/api/event/:id/registrationpage', getEvent, attending, viewRegistrationPage)
		.get('/api/event/:id/tickets', getEvent, attending, viewTickets)
		.get('/api/event/:id', redirectToRegistrationPage)
		.get('/api/event/:id/*', redirectToRegistrationPage)
	
		.all('/api/event/*', util.authorized)
		
		.all('/api/event/:id/*', getEvent, attending)
		.get('/api/event/:id/*', logImpression)
		.get('/api/event/:id', getEvent, attending, logImpression, viewEvent)*/

	app.get('/api/event/:id/tickets', viewTicketsAPI)
		.post('/api/event/:id/post', postMessageAPI)
		.get('/api/event/:id', getEventAPI)
		.get('/api/event/:id/avatar', getavatar)
		.post('/api/convertSVGToPNG', exports.convertImageSVGToPNG)
	/*
	 .get('/api/event/:id/registrationpage', viewRegistrationPage)*/
	
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

function getEventAPI(req, res)
{
	console.log("Get Event API".red);
	
	var query = {_id: req.params.id};
		
		models.Event.findById(req.params.id)
		.exec(function(err, thisevent) {
			if (err) throw err;
			if (thisevent) {
				console.log(thisevent);
				res.format({
					json: function() {
						res.send({
							event: thisevent
						});
					}
				});
				
		}
		});
		
}

function getavatar(req, res) {
	var query = {_id: req.params.id};

	models.Event.findById(req.params.id)
		.exec(function (err, thisevent) {
			if (err) throw err;
			if (thisevent) {

				models.Avatar.findById(thisevent.avatar)
					.exec(function (err, thisavatar) {
						if (err) throw err;
						console.log(thisavatar);

						avatar.url = util.editURL(avatar.url);
						res.format({
							json: function () {
								res.send({
									avatar: thisavatar
								});
							}
						});
					});
			}

		});

}

// Middleware to get :id param into res.local
function getEvent (req, res, next) {
	var id = req.params.id;
	
	try {
		id = mongoose.Types.ObjectId(id);
	} catch (e) {
		res.format({
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
	if (req.user) {
		next();
	} else {
		req.session.redirectAfterLogin = "/event/"+req.params.id+"/registrationpage#openAttend";
		res.redirect('/event/'+req.params.id+"/registrationpage")
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
			
			res.render('event/homepage', { title: res.locals.ev.name });
		})
	} else {
		if (config.production && res.locals.ev.tickets.length > 0 && res.locals.is_https != true) {
			res.redirect('https://'+req.host+'/event/'+res.locals.ev._id);
			return;
		}
		
		res.locals.eventStartFormatted = res.locals.ev.getStartDateFormatted();
		res.locals.eventEndFormatted = res.locals.ev.getEndDateCombinedFormatted();
		
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
				attendees.addAttendee(ev, req.user, true);
				
				var url = 'https://';
				if (ev.source.eventbrite) {
					url += 'eventbrite.com/e/';
				} else if (ev.source.facebook) {
					url += 'facebook.com/events/';
				}
				url += ev.source.id;
			
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
	if (!req.user && !req.session.redirectAfterLogin) {
		req.session.redirectAfterLogin = "/event/"+req.params.id+"/registrationpage";
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
			res.locals.eventEndFormatted = res.locals.ev.getEndDateCombinedFormatted();
			
			if (!res.locals.eventattending)
				res.locals.hideArrow = true;
			res.render('event/landingpage', { title: res.locals.ev.name });
		}
	});
}

function viewTicketsAPI (req, res) {
	// Found the Event currently requested by user.
	models.Event.findOne({_id:req.params.id} , function(err, event) 
	{
		// Fetch Messages By One By One.
		var query = {'_id': {$in: event.tickets}};
		
		models.Ticket.find(query)
		.select('price quantity name description start end showRemainingTickets')
		.exec(function(err, event_tickets) {
			res.format({
					json: function() {
						res.send({
							status: 200,
							tickets: event_tickets
						})
					}
				});
			}
		);
	})
	
}

function postMessageAPI(req, res) {


	var message = req.body.message;
	var user_id = req.body._id;

	models.Event.findOne({_id: req.params.id})
		.populate(
		{
			// Also need to check admin here.
			path: 'attendees',
			match: {user: user_id}
		}
	)
		.exec(function (err, event) {
			// Found the Event. Now Found the Attendee Against the User ID.
			//console.log(event);
			// only attendee can comment
			if (event.attendees.length > 0) {
				var message = req.body.message;
				var event_id = event._id;
				var attendee_id = event.attendees[0].user;

				// Find if a topic exist between two users or not
				var query = {users: {$all: [user_id, attendee_id]}};

				// Fetch My Topics.
				models.Topic.find(query)
					.select('users lastUpdated')
					.sort('lastUpdated')
					.exec(function (err, topics) {

						// topic found - add message to existing topic
						if (topics.length > 0) {
							var msg = new models.Message({
								sentBy: user_id,
								message: message,
								timeSent: Date.now(),
								topic: topics[0]._id
							});

							msg.save();


							res.format({
								json: function () {
									res.send({
										status: 200
									})
								}
							})
							return;
						}
						else // Not Topic found. Create a new one.
						{
							var newtopic = new models.Topic({
								lastUpdated: Date.now(),
								users: [user_id, attendee_id]
							});

							var msg = new models.Message({
								sentBy: user_id,
								message: message,
								timeSent: Date.now(),
								topic: newtopic._id
							});

							msg.save();

							newtopic.save();


							res.format({
								json: function () {
									res.send({
										status: 200
									})
								}
							})
							return;

						}
					});
			}
			else {
				console.log("Sending 404");
				res.status(404).send('Only Attendee Can Send Message');
			}
		});
}

exports.convertImageSVGToPNG = function(req,res) {
	console.log("in");
	/*var writeStream = fs.createWriteStream("E:/software/imagesconvert/image.png");
	 gm("E:/software/imagesconvert/1slider.svg").setFormat("png").write(writeStream, function(error){
	 console.log("Finished saving", error);
	 });*/
	var imageName = req.body.url;
	imageName = imageName.substr(imageName.lastIndexOf('/')+1);
	imageName = imageName.substr(0,imageName.indexOf('.'));
	console.log(imageName);
	gm(req.body.url).write(config.path + '/public/images/'+imageName+'1.png', function(err){
		if (err){
			console.log(err);
		} else{
			console.log('image converted.');
			res.format({
				json: function() {
					res.send({
						status: 200,
						url: util.editURL('/images/'+imageName+'1.png')
					})
				}
			})
			/*fs.readFile(config.path + '/public/images/'+imageName+'1.png',function(err,data){
				var base64Image = data.toString('base64');
				//var decodedImage = new Buffer(base64Image, 'base64');
				res.format({
					json: function() {
						res.send({
							status: 200,
							//base64: base64Image
							url: util.editURL('/images/'+imageName+'1.png')
						})
					}
				})
			})*/
		}
	})
}
