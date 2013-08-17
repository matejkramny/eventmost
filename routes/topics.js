var fs = require('fs'),
	models = require('../models')
	, mongoose = require('mongoose')
	, io = require('../app').io

exports.router = function (app) {
	app.get('/topics/new', newTopic)
		.get('/topics', show)
		.get('/topic/:id', showTopic)
		.post('/topic/:id/new', newMessage)
		.post('/topic/:id/update', updateTopic)
	
	require('../app').io.of('/message').on('connection', function(socket) {
		console.log("Nw socket")
		socket.on('message', function(data) {
			console.log(data);
		})
	})
}

function show (req, res) {
	var withUser;
	var search = [
		{ users: req.user._id }
	]
	if (req.query.with != null) {
		withUser = mongoose.Types.ObjectId(req.query.with);
		search.push(withUser);
	}
	
	models.Topic
		.find({
			$and: search
		})
		.populate('users')
		.sort('-lastUpdated')
		.exec(function(err, topics) {
			if (err) throw err;
			
			var topic = "Topics";
			if (topics.length && withUser) {
				for (var i = 0; i < topics[0].users.length; i++) {
					if (topics[0].users[i]._id.equals(withUser)) {
						topic += " with "+topics[0].users[i].getName()
					}
				}
			}
			
			res.format({
				html: function() {
					res.locals.topics = topics;
					res.render('topics', { pageName: topic });
				},
				json: function() {
					res.send({
						topics: topics
					})
				}
			})
		})
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
			
					res.redirect('/topic/'+topic._id);
				})
			}
		})
		
		return;
	}
	
	res.render('newtopic')
}

function showTopic(req, res) {
	var id = req.params.id;
	
	models.Topic.findOne({
		_id: mongoose.Types.ObjectId(id)
	}, function(err, topic) {
		if (err) throw err;
		
		if (topic) {
			models.Message.find({
				topic: topic._id
			}).sort('-timeSent').exec(function(err, messages) {
				if (err) throw err;
				
				res.format({
					html: function() {
						res.locals.topic = topic;
						res.locals.messages = messages;
						res.render('topic')
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
					res.redirect('/topics')
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
	console.log(text);
	
	models.Topic.findOne({
		_id: mongoose.Types.ObjectId(id),
		users: {
			$in: [req.user._id]
		}
	}, function(err, topic) {
		if (err) throw err;
		
		if (topic) {
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
						res.redirect('/topic/'+topic._id)
					},
					json: function() {
						res.send({
							sent: true
						})
					}
				})
			})
		} else {
			// 404 || Permissions
			
			res.format({
				html: function() {
					res.status(404);
					res.redirect('/topics')
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

function updateTopic(req, res) {
	var id = req.params.id;
	var title = req.body.topicname;
	console.log(title);
	models.Topic.findOne({
		_id: mongoose.Types.ObjectId(id)
	}, function(err, topic) {
		if (err) throw err;
		
		topic.name = title;
		topic.lastUpdated = Date.now()
		topic.save(function(err) {
			res.redirect('/topic/'+topic._id)
		})
	});
}