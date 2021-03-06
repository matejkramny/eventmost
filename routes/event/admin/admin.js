var fs = require('fs'),
	models = require('../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../util')
	, event = require('../event')
	, feedback = require('./feedback')
	, summary = require('./summary')
	, email = require('./email')
	, register = require('./register')
	, attendees = require('../attendees')

exports.router = function (app) {
	app.get('/event/:id/admin', util.authorized, event.attending, mustBeAdmin, eventAdmin)
	
	// middleware that checks if (util.authorized = loggedin), (event.attending = is attending event), (mustbeadmin = checks if user is administrator)
		.all('/event/:id/admin/*', util.authorized, event.attending, mustBeAdmin)
	
	// register other routes here
		.get('/event/:id/admin/logos', eventLogo)
		.get('/event/:id/admin/panel', eventPanel)
		.get('/event/:id/admin/addAdmin/:attendee', addAdmin)
		.get('/event/:id/admin/addUserAsAdmin/:user', addUserAsAdmin)
	
	email.router(app)
	summary.router(app)
	feedback.router(app)
	register.router(app)
}

function addUserAsAdmin(req, res){
	
	var user = {
		"_id" : mongoose.Types.ObjectId(req.params.user)
	}

	var ev = res.locals.ev;

	attendees.isReallyAttending(ev, user, function(err, existingAttendee) {
		if(existingAttendee == null){
			console.log('null');
			/*
				- add user as attendee
				- res.redirect('/event/'+ev._id+'/admin/addAdmin/'+existingAttendee._id);
			*/

			var attendee = new models.Attendee({
				
				isAttending: true,
				user: user._id,
				admin: true,
				category: 'Planner',

			});

			attendee.save();
			
			models.Event.findById(ev._id, function(err, event) {
				event.attendees.push(attendee._id);
				event.save(function(err){
					req.session.flash = ["New admin added successfully"];
					res.redirect('/event/'+res.locals.ev._id)
				});

				
			});

		}else{
			if(existingAttendee.admin == true){
				req.session.flash = ["This user is already an admin"];
				res.redirect('/event/'+res.locals.ev._id)
			}else{
				//console.log(existingAttendee._id);
				res.redirect('/event/'+ev._id+'/admin/addAdmin/'+existingAttendee._id);
			}
			
		}

	})
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
			//req.session.flash = ["\""+attendee.user.getName()+"\" was Made Admin"];
			req.session.flash = ["New admin added successfully"];
			
			break;
		}
	}
	
	res.redirect('back')
}