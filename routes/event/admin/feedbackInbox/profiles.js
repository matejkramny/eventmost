var fs = require('fs')
	models = require('../../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../../util')
	, event = require('../../event')
	, async = require('async')

exports.router = function (app) {
	app.get('/event/:id/admin/feedback/:fid/inbox/savedProfiles', exports.showSavedProfiles)
}

exports.showSavedProfiles = function (req, res) {
	models.User.find({ savedProfiles: res.locals.feedbackProfile._id })
		.exec(function(err, saver) {
		if (err) throw err;
		if (saver) {
			res.format({
				html: function() {
					res.render('event/admin/feedbackInbox/profiles', { profileSavers: saver, pageName: "Saved Profiles", title: "Saved Profiles" });
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