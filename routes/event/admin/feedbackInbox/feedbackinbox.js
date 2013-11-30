var fs = require('fs')
	models = require('../../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../../util')
	, event = require('../../event')
	, async = require('async')
	, topic = require('./topic')
	, messages = require('./messages')
	, cards = require('./cards')
	, profiles = require('./profiles')
	, wall = require('./wall')

exports.router = function (app) {
	app.get('/event/:id/admin/feedback/:fid/inbox/*', populateInbox)
		.get('/event/:id/admin/feedback/:fid/inbox', populateInbox, show)
	
	messages.router(app)
	cards.router(app)
	profiles.router(app)
	wall.router(app)
	topic.router(app)
}

function populateInbox (req, res, next) {
	var u = res.locals.feedbackProfile;
	
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
			models.User.find({savedProfiles: req.user._id }).exec(function(err, savers) {
				res.locals.savers = savers;
				cb(null)
			});
		},
		function (cb) {
			req.user.mailboxUnread = 0;
			req.user.save();
			cb(null)
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
			res.render('event/admin/feedbackInbox/all', { pageName: "Inbox Dashboard", title: "Inbox" });
		},
		json: function() {
			res.send({
				topics: topics
			})
		}
	})
}