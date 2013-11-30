var fs = require('fs')
	models = require('../../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../../util')
	, event = require('../../event')
	, async = require('async')

exports.router = function (app) {
	app.get('/event/:id/admin/feedback/:fid/inbox/cards', showCards)
}

function showCards (req, res) {
	res.render('event/admin/feedbackInbox/business', { pageName: "Received Business Cards", title: "Private Messages" })
}