var fs = require('fs')
	, models = require('../../models')
	, mongoose = require('mongoose')
	, util = require('../../util')
	, async = require('async')
	, transport = require('../../app').transport

exports.router = function (app) {
	app.get('/inbox/wall', showWall)
}

function showWall (req, res) {
	res.render('inbox/pms', { pageName: "Public Messages", title: "Public Messages" });
}