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
}

function getMessage (req, res, next) {
	var id = req.params.id;
	
	try {
		id = mongoose.Types.ObjectId(id);
	} catch (e) {
		res.redirect('/inbox/messages');
		return;
	}
	
	models.Topic.findOne({ _id: id }, function(err, topic) {
		if (err) throw err;
		
		if (!topic) {
			res.redirect('/inbox/messages')
			return;
		}
		
		models.Message.find({
			topic: topic._id
		}).populate('sentBy')
		  .sort('-timeSent').exec(function(err, messages) {
			if (err) throw err;
			
			res.locals.message = topic;
			res.locals.messages = messages;
			next()
		})
	})
}

function showMessage (req, res) {
	res.render('inbox/message', { pageName: "Message X", title: "Message X" })
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
		res.redirect('/inbox/messages')
	});
}
function newMessage (req, res) {
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
					res.locals.messages = topics;
					res.render('inbox/messages', { pageName: "Private Messages", title: "Private Messages" });
				},
				json: function() {
					res.send({
						messages: topics
					})
				}
			})
		})
}