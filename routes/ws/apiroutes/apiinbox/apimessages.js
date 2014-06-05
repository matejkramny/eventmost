var fs = require('fs')
	, models = require('../../../../models')
	, mongoose = require('mongoose')
	, util = require('../../util')
	, async = require('async')
	, inbox = require('./index')

exports.router = function (app) {
	app.post('/api/inbox/messages', showMessages)
		.post('/api/inbox/messages/new', doNewMessage)
		.get('/api/inbox/message/:id', getMessage, showMessage)
		.post('/api/inbox/message/:id', getMessage, postMessage)
}

function getMessage (req, res, next) {
	var id = req.params.id;
	
	try {
		id = mongoose.Types.ObjectId(id);
	} catch (e) {
		res.send({error: "Topic not found"});
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
		res.send({error: "no message found"})
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
		
	res.format({
		json: function() {
			res.send({
				message: res.locals.message,
				messages: res.locals.messages
			})
		}
	})
}

function postMessage (req, res) {
	var id = req.params.id;
	var text = req.body.message;
	
	// check if can make messages
	if (req.session.loggedin_as_user_locals != null && req.session.loggedin_as_user_locals.inbox_send_disabled === true) {
		res.format({
			json: function() {
				res.send({
					status: 404,
					message: "Disabled"
				})
			}
		})
		return;
	}
	
	if (text.length == 0) {
		res.format({
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
			req.session.flash.push("Unauthorized");
			res.redirect('/')
			return;
		}
		
		//Updating User's notification
		for (var i = 0; i < message.users.length; i++) {
			var u = message.users[i];
			
			// dont update this user
			if (u._id.equals(req.user._id)) continue;
			
			u.mailboxUnread++;
			
			u.save();
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
		
		var notAlertedUsers = inbox.pushMessageToSockets({
			message: {
				_id: msg._id,
				topic: msg.topic,
				message: msg.message,
				read: msg.read,
				timeSent: msg.timeSent,
				sentBy: req.user
			},
			topic: message
		});
		
		for (var i = 0; i < notAlertedUsers.length; i++) {
			var u = notAlertedUsers[i];
			// These people are not connected by WS, so they're offline..
			if (u.notification.email.privateMessages) {
				inbox.emailMessageNotification(u, req.user, "inbox", "Message from <strong>"+req.user.getName()+"</strong>: "+msg.message);
			}
		}
		
		msg.save(function(err) {
			res.format({
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
	if (req.body.to != null) {
		try {
			to = mongoose.Types.ObjectId(req.body.to);
		} catch (e) {
			to = null;
		}
	}
	
	// check if can make messages
	if (req.session.loggedin_as_user_locals != null && req.session.loggedin_as_user_locals.inbox_send_disabled === true) {
		res.format({
			json: function() {
				res.send({
					status: 404,
					message: "Disabled"
				})
			}
		})
		return;
	}
	
	models.User.findOne({ _id: to }, function(err, user) {
		console.log("to: "+to)
		if (!user) {
			res.format({
				json: function() {
					res.send(400, {
						message: 'No Such User'
					});
				}
			});
			
			return;
		}
		
		var topic = new models.Topic({
			lastUpdated: Date.now(),
			users: [req.user._id, user._id]
		})
		topic.save();
		res.format({
			json: function() {
				res.send({
					status: 200,
					message: {
						lastMessage: '',
						topic: {
							users: [req.user, user],
							lastUpdated: topic.lastUpdated,
							_id: topic._id
						}
					}
				})
			}
		})
	});
}

function showMessages (req, res) {
	res.format({
		json: function() {
			res.send({
				messages: res.locals.messages
			})
		}
	})
}