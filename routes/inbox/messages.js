var fs = require('fs')
	, models = require('../../models')
	, mongoose = require('mongoose')
	, util = require('../../util')
	, async = require('async')
	, transport = require('../../app').transport

exports.router = function (app) {
	app.get('/inbox/messages', showMessages)
		.get('/inbox/messages/new', newMessage)
		.post('/inbox/messages/new', doNewMessage)
		.get('/inbox/message/:id', getMessage, showMessage)
		.post('/inbox/message/:id', getMessage, postMessage)
}

function getMessage (req, res, next) {
	var id = req.params.id;
	
	try {
		id = mongoose.Types.ObjectId(id);
	} catch (e) {
		res.redirect('/inbox/messages');
		return;
	}
	
	var message = null;
	for (var i = 0; i < res.locals.messages.length; i++) {
		var msg = res.locals.messages[i].topic;
		if (msg._id.equals(id)) {
			message = msg;
			break;
		}
	}
	
	if (!message) {
		res.redirect('/inbox/messages')
		return;
	}
	
	
	models.Message.find({
		topic: message._id
	}).populate('sentBy')
	  .sort('-timeSent').exec(function(err, messages) {
		if (err) throw err;
		
		res.locals.message = message;
		res.locals.messages = messages;
		
		next()
	})
}

function showMessage (req, res) {
	var otherUser = null;
	for (var i = 0; i < res.locals.message.users.length; i++) {
		if (!req.user._id.equals(res.locals.message.users[i]._id)) {
			otherUser = res.locals.message.users[i];
			break;
		}
	}
	
	var name = "Private Message"
	if (otherUser)
		name = "PM to "+otherUser.getName();
	res.render('inbox/message', { pageName: name, title: name })
}

function postMessage (req, res) {
	var id = req.params.id;
	var text = req.body.message;
	if (text.length == 0) {
		res.format({
			html: function() {
				res.redirect('/inbox/message/'+id);
			},
			json: function() {
				res.send({
					status: 403,
					message: "Too short"
				})
			}
		})
		return;
	}
	
	var message = res.locals.message
	if (message) {
		var isUser = false;
		for (var i = 0; i < message.users.length; i++) {
			if (message.users[i]._id.equals(req.user._id)) {
				isUser = true;
				break;
			}
		}
		
		if (!isUser) {
			//req.session.flash.push("Unauthorized")//- TODO Wrong flash
			res.redirect('/')
			return;
		}
		
		//Updating User's notification
		for (var i = 0; i < message.users.length; i++) {
			// dont update this user
			if (message.users[i]._id.equals(req.user._id)) continue;
			
			message.users[i].mailboxUnread++;
			notifyByEmail(message.users[i], message)
			
			message.users[i].save();
		}

		message.lastUpdated = Date.now();
		message.save(function(err) {
			if (err) throw err;
		});
		
		var msg = new models.Message({
			topic: message._id,
			message: text,
			read: false,
			timeSent: Date.now(),
			sentBy: req.user._id
		})
		msg.save(function(err) {
			res.format({
				html: function() {
					res.redirect('/inbox/message/'+message._id)
				},
				json: function() {
					res.send({
						sent: true
					})
				}
			});
		})
	} else {
		// 404
		
		res.format({
			html: function() {
				res.status(403);
				res.redirect('/inbox')
			},
			json: function() {
				res.send({
					status: 404
				})
			}
		})
	}
}

function doNewMessage (req, res) {
	var to;
	if (req.query.to != null) {
		try {
			to = mongoose.Types.ObjectId(req.query.to);
		} catch (e) {}
	}
	
	models.User.findOne({ _id: to }, function(err, user) {
		if (!user) {
			res.redirect('/inbox/messages/new');
			return;
		}
		
		var topic = new models.Topic({
			lastUpdated: Date.now(),
			users: [req.user._id, user._id]
		})
		topic.save();
		res.redirect('/inbox/message/'+topic._id)
	});
}
function newMessage (req, res) {
	// Dirty ol' hack
	doNewMessage(req, res);
	return;
	
	var to;
	if (req.query.to != null) {
		try {
			to = mongoose.Types.ObjectId(req.query.to);
		} catch (e) {}
	}
	
	models.User.findOne({ _id: to }, function(err, user) {
		res.locals.toUser = user;
		res.render('inbox/newMessage', { pageName: "New Private Message", title: "New Private Message" });
	})
}

function showMessages (req, res) {
	res.format({
		html: function() {
			res.render('inbox/messages', { pageName: "Private Messages", title: "Private Messages" });
		},
		json: function() {
			res.send({
				messages: res.locals.messages
			})
		}
	})
}

function notifyByEmail (person, message) {
	if (!person.email || person.email.length == 0) {
		console.log("No email")
		return;
	}
	
	var options = {
		from: "EventMost <notifications@eventmost.com>",
		to: person.email,
		subject: "Notifications Pending on EventMost ",
		html: "You have Notifications Pending on <strong>EventMost</strong>.<br/>\
<br />To view your notifications, click <a href='http://eventmost.com/inbox/message/"+message._id+"'>here</a>\
<br/><br/>You can turn off notifications in your settings. Please do not reply to this email, as we do not receive correspondence for this email address."
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