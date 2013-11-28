var fs = require('fs'),
	models = require('../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../util')
	, event = require('../event')

exports.router = function (app) {
	app.get('/event/:id/admin/feedback', eventFeedbackProfile)
		.get('/event/:id/admin/feedback/new', newFeedbackProfile)
		.post('/event/:id/admin/feedback/new', doNewFeedbackProfile)
}

function eventFeedbackProfile (req, res) {
	res.render('event/admin/feedback', { title: "Feedback Profile" })
}

function newFeedbackProfile (req, res) {
	res.render('event/admin/newFeedback', { title: "Create a new Feedback Profile" });
}

function doNewFeedbackProfile (req, res) {
	var profile = new models.User({
		position: req.body.position,
		company: req.body.company,
		website: req.body.website,
		desc: req.body.description,
		isFeedbackProfile: true,
		feedbackProfileEvent: res.locals.ev._id
	})
	profile.setName(req.body.name);
	
	profile.save();
	
	var attendee = new models.Attendee({
		user: profile._id,
		category: "Feedback Profile"
	})
	attendee.save()
	
	res.locals.ev.attendees.push(attendee._id)
	res.locals.ev.save()
	
	res.format({
		html: function() {
			res.redirect('/event/'+res.locals.ev._id+'/admin/feedback')
		},
		json: function() {
			res.send({
				status: 200
			})
		}
	})
}