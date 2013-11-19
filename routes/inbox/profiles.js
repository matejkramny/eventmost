var fs = require('fs')
	, models = require('../../models')
	, mongoose = require('mongoose')
	, util = require('../../util')
	, async = require('async')
	, transport = require('../../app').transport

exports.router = function (app) {
	app.get('/inbox/savedProfiles', exports.showSavedProfiles)
}

exports.showSavedProfiles = function (req, res) {
	models.User.find({savedProfiles: req.user._id })
		.exec(function(err, saver) {
		if (err) throw err;
		if (saver) {
			res.format({
				html: function() {
					res.render('inbox/profiles', { profileSavers: saver, pageName: "Saved Profiles", title: "Saved Profiles" });
				},
				json: function() {
					res.send({
						profileSavers: saver,
						pagename: "Saved Profiles"
					})
				}
			})
		}
	})
}