var fs = require('fs'),
	models = require('../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../util')
	, event = require('../event')

exports.router = function (app) {
	app.get('/event/:id/admin', util.authorized, event.attending, mustBeAdmin, eventAdmin)
	
	// middleware that checks if (util.authorized = loggedin), (event.attending = is attending event), (mustbeadmin = checks if user is administrator)
		.get('/event/:id/admin/*', util.authorized, event.attending, mustBeAdmin)
	
	// register other routes here
		.get('/event/:id/admin/logos', eventLogo)
		.get('/event/:id/admin/panel', eventPanel)
		.get('/event/:id/admin/email', eventEmail)
		.get('/event/:id/admin/feedback', eventFeedbackProfile)
		.get('/event/:id/admin/notifications', eventNotifications)
		.get('/event/:id/admin/summary', viewSummary)
		.get('/event/:id/admin/addAdmin/:attendee', addAdmin)
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

function addAdmin (req, res) {
	var att = req.params.attendee;
	try {
		att = mongoose.Types.ObjectId(att)
	} catch (e) {
		res.redirect('back')
		return;
	}
	
	var ev = res.locals.ev;
	for (var i = 0; i < ev.attendees.length; i++) {
		var attendee = ev.attendees[i];
		
		if (attendee._id.equals(att)) {
			attendee.admin = true;
			attendee.save()
			break;
		}
	}
	
	res.redirect('back')
}