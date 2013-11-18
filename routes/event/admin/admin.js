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
	app.get('/event/:id/admin/logos', eventLogo)
	app.get('/event/:id/admin/panel', eventPanel)
	app.get('/event/:id/admin/email', eventEmail)
	app.get('/event/:id/admin/feedback', eventFeedbackProfile)
	app.get('/event/:id/admin/notifications', eventNotifications)
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

function eventPanel (req, res){
	res.render('event/admin/panel', {title: "Event Admin Panel"})
}

function eventEmail (req, res){
	res.render('event/admin/email', {title: "Event Email"})
}

function eventFeedbackProfile (req, res){
	res.render('event/admin/feedback', {title: "Feedback Profile"})
}

function eventNotifications (req, res){
	res.render('event/admin/notifications', {title: "Event Notification"})
}

function eventAdmin (req, res) {
	res.render('event/admin/panel', { title: "Admin Panel" });
}

function eventLogo (req, res) {
	res.render('event/admin/logos', { title: "Add Logos"})
}

function viewSummary (req, res) {
	// Display summary
	res.render('event/admin/summary', { title: "Event Summary"})
}