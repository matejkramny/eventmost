var fs = require('fs')
	models = require('../../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../../util')
	, event = require('../../event')
	, async = require('async')

exports.router = function (app) {
	app.get('/event/:id/admin/feedback/:fid/inbox/messages', showMessages)
		.get('/event/:id/admin/feedback/:fid/inbox/messages/new', newMessage)
		.post('/event/:id/admin/feedback/:fid/inbox/messages/new', doNewMessage)
		.get('/event/:id/admin/feedback/:fid/inbox/message/:mid', getMessage, showMessage)
		.post('/event/:id/admin/feedback/:fid/inbox/message/:mid', getMessage, postMessage)
}

function getMessage (req, res, next) {
	var id = req.params.mid;
	
	try {
		id = mongoose.Types.ObjectId(id);
	} catch (e) {
		res.redirect('/event/'+req.params.id+'/admin/feedback/'+req.params.fid+'/inbox/messages');
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
		res.redirect('/event/'+req.params.id+'/admin/feedback/'+req.params.fid+'/inbox/messages')
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
		if (!res.locals.feedbackProfile.user._id.equals(res.locals.message.users[i]._id)) {
			otherUser = res.locals.message.users[i];
			break;
		}
	}
	
	var name = "Private Message"
	if (otherUser)
		name = "PM to "+otherUser.getName();
	res.render('event/admin/feedbackInbox/message', { pageName: name, title: name })
}

function postMessage (req, res) {
	var id = req.params.mid;
	var text = req.body.message;
	if (text.length == 0) {
		res.format({
			html: function() {
				res.redirect('/event/'+req.params.id+'/admin/feedback/'+req.params.fid+'/inbox/message/'+id);
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
			if (message.users[i]._id.equals(res.locals.feedbackProfile.user._id)) {
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
			if (message.users[i]._id.equals(res.locals.feedbackProfile.user._id)) continue;
			
			message.users[i].mailboxUnread++;
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
			sentBy: res.locals.feedbackProfile.user._id
		})
		msg.save(function(err) {
			res.format({
				html: function() {
					res.redirect('/event/'+req.params.id+'/admin/feedback/'+req.params.fid+'/inbox/message/'+message._id)
				},
				json: function() {
					res.send({
						sent: true
					})
				}
			});
			
			// Dispatch email to the person (if they have an email..)
			/*var dispatchTo = []
			for (var i = 0; i < message.users.length; i++) {
				if (message.users[i]._id.equals(res.locals.feedbackProfile.user._id)) {
					continue;
				}
				dispatchTo.push(message.users[i])
			}*/
			//notifyByEmail(dispatchTo, topic, message, res.locals.feedbackProfile.user)
		})
	} else {
		// 404
		
		res.format({
			html: function() {
				res.status(403);
				res.redirect('/event/'+req.params.id+'/admin/feedback/'+req.params.fid+'/inbox')
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
			res.redirect('/event/'+req.params.id+'/admin/feedback/'+req.params.fid+'/inbox/messages/new');
			return;
		}
		
		var topic = new models.Topic({
			lastUpdated: Date.now(),
			users: [res.locals.feedbackProfile.user._id, user._id]
		})
		topic.save();
		res.redirect('/event/'+req.params.id+'/admin/feedback/'+req.params.fid+'/inbox/message/'+topic._id)
	});
}
function newMessage (req, res) {
	// Dirty old' hack -- skips the initial page that asks the user to send first message
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
		res.render('event/admin/feedbackInbox/newMessage', { pageName: "New Private Message", title: "New Private Message" });
	})
}

function showMessages (req, res) {
	res.format({
		html: function() {
			res.render('event/admin/feedbackInbox/messages', { pageName: "Private Messages", title: "Private Messages" });
		},
		json: function() {
			res.send({
				messages: res.locals.messages
			})
		}
	})
}