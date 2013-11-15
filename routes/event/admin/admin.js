var fs = require('fs'),
	models = require('../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../util')
	, event = require('../event')

exports.router = function (app) {
	app.get('/event/:id/admin', util.authorized, event.attending, mustBeAdmin, eventAdmin)
	
	// middleware that checks if (util.authorized = loggedin), (event.attending = is attending event), (mustbeadmin = checks if user is administrator)
	app.get('/event/:id/admin/*', util.authorized, event.attending, mustBeAdmin)
	
	// register other routes here
	
	// example ..
	// the middleware defined above is ran before viewSummary, in the order defined..
	app.get('/event/:id/admin/summary', viewSummary)
}

function mustBeAdmin (req, res, next) {
	if (res.locals.eventadmin) {
		next()
	} else {
		res.redirect('/event/'+res.locals.ev._id);
	}
}

function eventAdmin (req, res) {
	res.render('event/admin/panel', { title: "Admin Panel" });
}

function viewSummary (req, res) {
	// Display summary
}