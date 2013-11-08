var fs = require('fs')
	, models = require('../../models')
	, mongoose = require('mongoose')
	, util = require('../../util')
	, async = require('async')
	, transport = require('../../app').transport

exports.router = function (app) {
	app.get('/inbox/messages', showMessages)
}

function showMessages (req, res) {
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
			
			var topic = "Conversations";
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
					res.render('inbox/conversations', { pageName: topic, title: "Messages" });
				},
				json: function() {
					res.send({
						topics: topics
					})
				}
			})
		})
}