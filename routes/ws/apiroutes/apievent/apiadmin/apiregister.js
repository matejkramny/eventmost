var fs = require('fs'),
	models = require('../../../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../util')
	, event = require('../apievent')
	, config = require('../../../../../config')

exports.router = function (app) {
	app.get('/api/event/:id/admin/register', showRegister)
}

function showRegister (req, res) {
	res.render('event/admin/register', { title: "Event Register" })
}