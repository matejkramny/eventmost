var fs = require('fs')
	, models = require('../../../../models')
	, mongoose = require('mongoose')
	, util = require('../../util')
	, async = require('async')
	, inbox = require('./index')

exports.router = function (app) {
	app.post('/api/inbox/messages', showMessagesAPI)
		.post('/api/inbox/messages/:id/new', doNewMessageAPI)
		.post('/api/inbox/topic/:id' , getMessageAPI)
		.post('/api/inbox/topics/new', newTopic)
		//.get('/api/inbox/message/:id', getMessageAPI, showMessageAPI)
		//.post('/api/inbox/message/:id', getMessageAPI, postMessageAPI)
}

function getMessageAPI (req, res) {
	var id = req.params.id;
	console.log(req.params.id);
	
	var query = {topic: req.params.id};
	
	models.Message.find(query)
	.populate({ path:"sentBy", select:'name'})
	.select('message timeSent sentBy')
	.sort('timeSent')
	.exec(function(err, topicmessages) {
	 console.log("++ EVS".red + topicmessages + "EVS -- ".red);
	 
	 		 res.format({
					json: function() {
						res.send({
							messages: topicmessages
						})
					}
				 });
	});
		
}

function newTopic (req , res)
{
	console.log("new topic".red);
	
	console.log(req.body);
	if(req.body._id == req.body._to)
	{
		res.status(404).send('To and From are same.');
		return;
	}
	
	// Find if a topic exists between two.
	var query = { users: {$all : [req.body._id , req.body._to]}};
	
	// Fetch My Topics.
	models.Topic.find(query)
	.select('users lastUpdated')
	.sort('lastUpdated')
	.exec(function(err, topics) {
	 	console.log("++ EVS".red + topics + "EVS -- ".red);
	 
	 	if(topics.length > 0) // Topic is already created.
	 	{
	 		res.status(200).send('Topic already created');
			return;
	 	}
	 	else // No topics found
	 	{
	 		var newtopic = new models.Topic({
			lastUpdated: Date.now(),
			users: [req.body._id, req.body._to]
			});
			
			
			newtopic.save(function(err) {
			res.format({
				json: function() {
					res.send({
						sent: true
					});
					}
				});
				});
	 	}		
	});
}

function showMessageAPI (req, res) {
	
	
	
	// var otherUser = null;
	// for (var i = 0; i < res.locals.message.users.length; i++) {
		// if (!req.user._id.equals(res.locals.message.users[i]._id)) {
			// otherUser = res.locals.message.users[i];
			// break;
		// }
	// }
// 	
	// var name = "Private Message"
	// if (otherUser)
		// name = "PM to "+otherUser.getName();
// 		
	// res.format({
		// json: function() {
			// res.send({
				// message: res.locals.message,
				// messages: res.locals.messages
			// })
		// }
	// })
}

function postMessageAPI (req, res) {
	
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

function doNewMessageAPI (req, res) {
	console.log("do New Message API ######".red);
	console.log(req.body);
	console.log(req.params.id);
	console.log("######".red);
	
	
	var msg = new models.Message({
			topic: req.params.id,
			message: req.body._message,
			read: false,
			timeSent: Date.now(),
			sentBy: req.body._id
		})
	
	
	msg.save(function(err) {
			res.format({
				json: function() {
					res.send({
						sent: true
					})
				}
			});
	});
}

function showMessagesAPI (req, res) {
	
	console.log("###### Show Messages API ----3".red);
	
	console.log(req.body._id);
	
	var currentuser = req.body._id;
	
	console.log("#############################".red);
		
	var query = { users: {$in : [currentuser]}};
	
	// Fetch My Topics.
	models.Topic.find(query)
	.populate({ path:"users", match:{_id : { $ne:currentuser} }})
	.select('users lastUpdated')
	.sort('lastUpdated')
	.exec(function(err, topics) {
	 console.log("++ EVS".red + topics + "EVS -- ".red);
	 
	 		res.format({
					json: function() {
						res.send({
							topics: topics
						})
					}
				});
	 
	});
}
