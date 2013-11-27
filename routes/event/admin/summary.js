var fs = require('fs'),
	models = require('../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../util')
	, event = require('../event')

exports.router = function (app) {
	app.get('/event/:id/admin/summary', viewSummary)
}

function viewSummary (req, res) {
	// Display summary
	res.render('event/admin/summary', { title: "Event Summary" })
}