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

exports.router = function (app) {
	app.get('/inbox/*', util.authorized)
		.get('/inbox', util.authorized, show)
	
	messages.router(app)
	cards.router(app)
	profiles.router(app)
	wall.router(app)
	topic.router(app)
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
			
			res.format({
				html: function() {
					res.locals.topics = topics;
					res.render('inbox/all', { pageName: "Inbox Dashboard", title: "Inbox" });
				},
				json: function() {
					res.send({
						topics: topics
					})
				}
			})
		})
}
