var fs = require('fs'),
	models = require('../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../util')
	, event = require('../event')

exports.router = function (app) {
	app.get('/event/:id/admin', util.authorized, event.attending, mustBeAdmin, eventAdmin, eventLogo, eventEmail, eventFeedbackProfile, eventNotifications)
	
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

function eventEmail (req, res){
	res.render('event/admin/panel', {title: "Event Email"})
}

function eventFeedbackProfile (req, res){
	res.render('event/admin/eventProfile', {title: "Feedback Profile"})
}

function eventNotifications (req, res){
	res.render('event/admin/eventNotifications', {title: "Event Notification"})
}

function eventAdmin (req, res) {
	res.render('event/admin/panel', { title: "Admin Panel" });
}

function eventLogo (req, res) {
	res.render('event/admin/logos', { title: "Add Logos"})
}

function viewSummary (req, res) {
	// Display summary
}