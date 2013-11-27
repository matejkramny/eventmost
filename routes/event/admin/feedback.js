var fs = require('fs'),
	models = require('../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../util')
	, event = require('../event')

exports.router = function (app) {
	app.get('/event/:id/admin/feedback', eventFeedbackProfile)
}

function eventFeedbackProfile (req, res){
	res.render('event/admin/feedback', { title: "Feedback Profile" })
}