var fs = require('fs')
	, models = require('../../models')
	, mongoose = require('mongoose')
	, util = require('../../util')
	, async = require('async')
	, transport = require('../../app').transport

exports.router = function (app) {
	app.get('/inbox/savedProfiles', showSavedProfiles)
}

function showSavedProfiles (req, res) {
	res.render('inbox/profiles', { pageName: "People who saved your profile", title: "Saved Profiles"})
}