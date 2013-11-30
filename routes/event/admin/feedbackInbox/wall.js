var fs = require('fs')
	models = require('../../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../../util')
	, event = require('../../event')
	, async = require('async')

exports.router = function (app) {
	app.get('/event/:id/admin/feedback/:fid/inbox/wall', showWall)
}

function showWall (req, res) {
	res.render('event/admin/feedbackInbox/pms', { pageName: "Public Messages", title: "Public Messages" });
}