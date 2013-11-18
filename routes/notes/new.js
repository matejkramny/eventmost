var fs = require('fs')
	, models = require('../../models')
	, mongoose = require('mongoose')
	, util = require('../../util')
	, async = require('async')
	, transport = require('../../app').transport

exports.router = function (app) {
	app.get('/notes/new', newNote)
}

function newNote (req, res) {
	res.render('notes/new', { pageName: "New Note", title: "New Note"})
}