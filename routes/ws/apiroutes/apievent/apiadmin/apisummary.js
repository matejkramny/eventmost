var fs = require('fs'),
	models = require('../../../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../util')
	, event = require('../apievent')

exports.router = function (app) {
	app.get('/api/event/:id/admin/summary', viewSummary)
}

function viewSummary (req, res) {
	// Display summary
	res.render('event/admin/summary', { title: "Event Summary" })
}