var fs = require('fs'),
	models = require('../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../util')
	, event = require('../event')
	, feedbackinbox = require('./feedbackInbox')
	, config = require('../../../config')

exports.router = function (app) {
	app.get('/event/:id/admin/feedback/:fid/accessInbox', accessInbox)
}

function accessInbox (req, res) {
	req.session.loggedin_as_user = req.user._id;
	req.session.loggedin_as_user_referrer = req.get('referrer');
	req.session.loggedin_as_user_restrict = /^\/(inbox|search)/;
	req.session.loggedin_as_user_redirect_restricted = "/inbox";
	req.session.loggedin_as_user_locals = {
		hide_bar_right: true,
		loggedin_as_user_message: "<strong>"+res.locals.feedbackProfile.user.getName()+"</strong>'s Inbox",
		loggedin_as_user_return_message: "Back to The Event"
	}
	
	req.login(res.locals.feedbackProfile.user, function(err) {
		res.redirect('/inbox');
	})
}