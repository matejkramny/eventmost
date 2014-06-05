var fs = require('fs'),
	models = require('../../../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../util')
	, event = require('../apievent')

exports.router = function (app) {
	app.get('/api/event/:id/admin/email', eventEmail)
}

function eventEmail (req, res){
	res.render('event/admin/email', { title: "Event Email" })
}