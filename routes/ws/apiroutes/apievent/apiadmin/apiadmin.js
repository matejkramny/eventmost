var fs = require('fs'),
	models = require('../../../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../util')
	, event = require('../apievent')
	, feedback = require('./apifeedback')
	, summary = require('./apisummary')
	, email = require('./apiemail')
	, register = require('./apiregister')

exports.router = function (app) {
	app.get('/event/:id/admin', util.authorized, event.attending, mustBeAdmin, eventAdmin)
	
	// middleware that checks if (util.authorized = loggedin), (event.attending = is attending event), (mustbeadmin = checks if user is administrator)
		.all('/api/event/:id/admin/*', util.authorized, event.attending, mustBeAdmin)
	
	// register other routes here
		.get('/api/event/:id/admin/logos', eventLogo)
		.get('/api/event/:id/admin/panel', eventPanel)
		.get('/api/event/:id/admin/addAdmin/:attendee', addAdmin)
	
	email.router(app)
	summary.router(app)
	feedback.router(app)
	register.router(app)
}

function mustBeAdmin (req, res, next) {
	if (req.session.loggedin_as_user && req.url.match(req.session.loggedin_as_user_restrict)) {
		// Pass. The user is being simulated as someone else.
		// TODO Could do a check whether loggedin_as_user is admin in this event. But it is 100% unlikely that would ever be false.
		next();
		
		return;
	}
	
	if (res.locals.eventadmin) {
		next()
	} else {
		res.redirect('/event/'+res.locals.ev._id);
	}
}

function eventPanel (req, res){
	res.render('event/admin/panel', { title: "Event Admin Panel" })
}

function eventAdmin (req, res) {
	res.render('event/admin/panel', { title: "Admin Panel" });
}

function eventLogo (req, res) {
	res.render('event/admin/logos', { title: "Add Logos"})
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
			req.session.flash = ["\""+attendee.user.getName()+"\" was Made Admin"];
			break;
		}
	}
	
	res.redirect('back')
}