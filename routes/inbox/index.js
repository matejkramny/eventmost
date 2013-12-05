var fs = require('fs')
	, models = require('../../models')
	, mongoose = require('mongoose')
	, util = require('../../util')
	, async = require('async')
	, transport = require('../../app').transport
	, topic = require('./topic')
	, messages = require('./messages')
	, cards = require('./cards')
	, profiles = require('./profiles')
	, wall = require('./wall')
	, transport = require('../../config').transport
	, check = require('validator').check

exports.router = function (app) {
	app.all('/inbox/*', util.authorized, populateInbox)
		.get('/inbox', util.authorized, populateInbox, show)
		.get('/takeProfile/:tid/:secret', getRequest, takeover)
		.post('/takeProfile/:tid/:secret', getRequest, doTakeover)
		.get('/inbox/takeoverRequest/:tid/:secret/:action', getRequest, doMerge)
	
	messages.router(app)
	cards.router(app)
	profiles.router(app)
	wall.router(app)
	topic.router(app)
}

function populateInbox (req, res, next) {
	var u = req.user;
	
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
			models.User.find({ savedProfiles: req.user._id }).exec(function(err, savers) {
				res.locals.savers = savers;
				cb(null)
			});
		},
		function (cb) {
			req.user.mailboxUnread = 0;
			req.user.save();
			cb(null)
		},
		function (cb) {
			// Find UserTakeoverRequest(s)...
			models.UserTakeoverRequest.find({
				user: req.user._id,
				active: true
			}).populate('user requestedBy takeoverUser event').exec(function(err, requests) {
				if (err) throw err;
				
				res.locals.takeoverRequests = requests;
				cb(null);
			})
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
			res.render('inbox/all', { pageName: "Inbox Dashboard", title: "Inbox" });
		},
		json: function() {
			res.send({
				topics: topics
			})
		}
	})
}

function getRequest (req, res, next) {
	var tid = req.params.tid;
	var secret = req.params.secret;
	
	models.UserTakeoverRequest.findOne({
		_id: tid,
		secret: secret,
		active: true
	}).populate('event takeoverUser requestedBy user').exec(function(err, request) {
		if (err || !request) {
			console.log("Redirecing")
			res.redirect('back');
			return;
		}
		
		res.locals.takeoverRequest = request;
		next();
	})
}
function takeover (req, res) {
	res.render('inbox/takeover')
}
function doTakeover (req, res) {
	var password = req.body.password,
		email = req.body.login;
	
	try {
		check(email, "Please enter an email address").isEmail();
		check(password, "Password must be at least 3 characters long..").min(3)
	} catch (e) {
		throw e;
		req.session.flash = [e.message];
		res.redirect('back')
		return;
	}
	
	models.User.find({
		email: email
	}, function(err, users) {
		if (err) throw err;
		
		if (users.length == 0) {
			// email is not used. good
			var request = res.locals.takeoverRequest;
			
			request.takeoverUser.setPassword(password);
			request.takeoverUser.email = email;
			request.takeoverUser.isFeedbackProfile = false;
			request.takeoverUser.feedbackProfileEvent = null;
			request.takeoverUser.save();
			
			request.active = false;
			request.wasAccepted = true;
			request.actionTaken = Date.now();
			request.save();
			
			res.redirect('/#login-failed');
		} else {
			// email is used.
			req.session.flash = ["Email is already taken"];
			res.redirect('back')
		}
	})
}
function doMerge (req, res) {
	var request = res.locals.takeoverRequest;
	
	var action = req.params.action;
	if (action != "accept" && action != "ignore") {
		res.redirect('back');
		return;
	}
	
	request.actionTaken = Date.now();
	
	if (action == "ignore") {
		request.wasIgnored = true;
		request.active = false;
		request.save()
		
		res.redirect('back');
		return;
	}
	
	// Accept
	request.actionTaken = Date.now();
	request.wasAccepted = true;
	request.active = false;
	request.save();
	
	request.takeoverUser.isFeedbackProfile = false;
	request.takeoverUser.feedbackProfileEvent = null;
	request.takeoverUser.save();
	// TODO Modify Topics, Messages, User.carsd etc to this user's ID.
	res.redirect('back')
}

exports.emailNotification = function (person, link) {
	if (!(person.mailboxUnread == 0 && person.lastAccess.getTime() + 60 * 5 * 1000 < Date.now())) {
		return
	}
	if (!person.email || person.email.length == 0) {
		console.log("No email")
		return;
	}
	
	var options = {
		from: "EventMost <notifications@eventmost.com>",
		to: person.getName()+" <"+person.email+">",
		subject: "Notifications Pending on EventMost ",
		html: "<img src=\"http://eventmost.com/images/logo.svg\">\
<br/><br/><p><strong>Hi "+person.getName()+",</strong><br/><br/>We're sorry to interrupt you, but you have some notifications pending on EventMost.<br/>\
<br />Click <a href='http://eventmost.com/"+link+"'>here</a> to view your all your notifications.\
<br /><br />Note: No more emails will be sent until you view the notifications.\
</p><br/>You can turn off email notifications in your settings.<br/>\
Please do not reply to this email, because we are super popular and probably won't have time to read it..."
	}
	transport.sendMail(options, function(err, response) {
		if (err) throw err;
		
		console.log("Email sent.."+response.message)
	})
	
	// Record that an email was sent
	var emailNotification = new models.EmailNotification({
		to: person,
		email: person.email,
		type: "newMessage"
	})
	emailNotification.save(function(err) {
		if (err) throw err;
	});
}