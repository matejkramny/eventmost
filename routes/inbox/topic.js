var fs = require('fs')
	, models = require('../../models')
	, mongoose = require('mongoose')
	, util = require('../../util')
	, async = require('async')
	, transport = require('../../app').transport

exports.router = function (app) {
	app.get('/inbox/conversation/*', util.authorized)
		.get('/inbox/conversation/new', newTopic)
		.get('/inbox/conversation/:id', showTopic)
		.post('/inbox/conversation/:id/new', newMessage)
		.post('/inbox/conversation/:id/update', updateTopic)
}

function newTopic (req, res) {
	if (req.query.with != null) {
		// Create a topic
		var wUser = mongoose.Types.ObjectId(req.query.with);
		
		models.User.findOne({
			_id: wUser
		}, function(err, user) {
			if (err) throw err;
			
			if (user) {
				var name = "Conversation with "+req.user.getName() + " and 1 more";
				var topic = new models.Topic({
					lastUpdated: Date.now(),
					users: [
						req.user._id,
						mongoose.Types.ObjectId(req.query.with)
					],
					name: name
				});
				topic.save(function(err) {
					if (err) throw err;
			
					res.redirect('/inbox/conversation/'+topic._id);
				})
			}
		})
		
		return;
	}
	
	res.render('newconversation')
}

function showTopic(req, res) {
	var id = req.params.id;
	
	models.Topic.findOne({
		_id: mongoose.Types.ObjectId(id)
	}).populate('users').exec(function(err, topic) {
		if (err) throw err;
		
		if (topic) {
			var isUser = false;
			for (var i = 0; i < topic.users.length; i++) {
				if (topic.users[i]._id.equals(req.user._id)) {
					isUser = true;
					break;
				}
			}
			
			if (!isUser) {
				req.session.flash.push("Unauthorized")
				res.redirect('/')
				return;
			}
			
			models.Message.find({
				topic: topic._id
			}).sort('-timeSent').populate('sentBy').exec(function(err, messages) {
				if (err) throw err;
				
				res.format({
					html: function() {
						res.locals.topic = topic;
						res.locals.messages = messages;
						res.render('conversation', { title: topic.name })
					},
					json: function() {
						res.send({
							messages: messages,
							topic: topic
						})
					}
				})
			})
		} else {
			res.format({
				html: function() {
					res.status(404);
					res.redirect('/inbox')
				},
				json: function() {
					res.send({
						message: "Not found"
					})
				}
			})
		}
	})
}

function newMessage(req, res) {
	var id = req.params.id;
	var text = req.body.message;
	if (text.length == 0) {
		res.format({
			html: function() {
				res.redirect('/inbox/conversation/'+id);
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
	
	models.Topic.findOne({
		_id: mongoose.Types.ObjectId(id),
		users: {
			$in: [req.user._id]
		}
	}).populate('users').exec(function(err, topic) {
		if (err) throw err;
		
		if (topic) {
			var isUser = false;
			for (var i = 0; i < topic.users.length; i++) {
				if (topic.users[i]._id.equals(req.user._id)) {
					isUser = true;
					break;
				}
			}
			
			if (!isUser) {
				req.session.flash.push("Unauthorized")
				res.redirect('/')
				return;
			}
			
			topic.lastUpdated = Date.now();
			topic.save(function(err) {
				if (err) throw err;
			});
			
			var message = new models.Message({
				topic: topic._id,
				message: text,
				read: false,
				timeSent: Date.now(),
				sentBy: req.user._id
			})
			message.save(function(err) {
				res.format({
					html: function() {
						res.redirect('/inbox/conversation/'+topic._id)
					},
					json: function() {
						res.send({
							sent: true
						})
					}
				});
				
				// Dispatch email to the person (if they have an email..)
				var dispatchTo = []
				for (var i = 0; i < topic.users.length; i++) {
					if (topic.users[i]._id.equals(req.user._id)) {
						continue;
					}
					dispatchTo.push(topic.users[i])
				}
				//notifyByEmail(dispatchTo, topic, message, req.user)
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
	})
}

function notifyByEmail (people, topic, message, from) {
	console.log("Dispatching email to "+people.length+ " people");
	async.each(people, function(person, cb) {
		if (!person.email || person.email.length == 0) {
			console.log("No email")
			cb(null)
			return;
		}
		
		var options = {
			from: "EventMost <noreply@eventmost.com>",
			to: person.email,
			subject: "New message from "+from.getName(),
			html: "You have a new message on <strong>EventMost</strong>.<br />To view your message, click <a href='http://eventmost.com/conversation/"+topic._id+"'>here</a><br/><br/>You can turn off notifications in your settings. Please do not reply to this email, as we do not receive correspondence for this email address."
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
	}, function(err) {
		if (err) throw err;
		console.log("Completed sending emails")
	})
}

function updateTopic(req, res) {
	var id = req.params.id;
	var title = req.body.topicname;
	
	models.Topic.findOne({
		_id: mongoose.Types.ObjectId(id)
	}, function(err, topic) {
		if (err) throw err;
		
		if (!topic) {
			res.format({
				html: function() {
					res.redirect('/');
				},
				json: function() {
					res.send({
						status: 404
					})
				}
			})
			return;
		}
		
		var isUser = false;
		for (var i = 0; i < topic.users.length; i++) {
			if (topic.users[i].equals(req.user._id)) {
				isUser = true;
				break;
			}
		}
		
		if (!isUser) {
			req.session.flash.push("Unauthorized")
			res.redirect('/')
			return;
		}
		
		topic.name = title;
		topic.lastUpdated = Date.now()
		topic.save(function(err) {
			res.redirect('/inbox/conversation/'+topic._id)
		})
	});
}