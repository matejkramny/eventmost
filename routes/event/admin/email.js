var fs = require('fs'),
	models = require('../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../util')
	, event = require('../event')

exports.router = function (app) {
	app.get('/event/:id/admin/email', eventEmail)
}

function eventEmail (req, res){
	res.render('event/admin/email', { title: "Event Email" })
}