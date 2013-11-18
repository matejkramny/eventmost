var fs = require('fs')
	, models = require('../../models')
	, mongoose = require('mongoose')
	, util = require('../../util')
	, async = require('async')
	, transport = require('../../app').transport

exports.router = function (app) {
	app.all('/notes/*',  util.authorized)
	.get('/notes', util.authorized, showNotes)
}

function showNotes (req, res) {
	res.render('notes/index', { pageName: "Notes", title: "Notes"})
}