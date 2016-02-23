var fs = require('fs'),
	models = require('../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../util')
	, event = require('../event')

exports.router = function (app) {
	app.get('/event/:id/admin/email', eventEmail)
	app.post('/event/:id/admin/email', sendEmail)
}

function eventEmail (req, res){
	res.render('event/admin/email', { title: "Event Email" })
}

function sendEmail(req, res){

	var subject = req.body.subject;
	var message = req.body.message;
	var logged_in_user_id = res.locals.user._id;

	var attendees = res.locals.ev.attendees;
	attendees.forEach(function(usr){
		var attendee_id = usr.user._id;
		var email = usr.user.email;
		if(String(logged_in_user_id) != String(attendee_id)){
			var htmlcontent = 'Hi, <br /> There is a message for you from EventMost. <br /><br />'+message;
			var options = {
					from: "EventMost <noreply@eventmost.com>",
					to: " <"+email+">",
					subject: subject,
					html: htmlcontent
				}



			config.transport.sendMail(options, function(err, response) {
				if (err) throw err;
			});

		}
	});

	
	req.session.flash.push("Message sent to all attendees!");
	res.redirect('/event/'+req.params.id);
	//res.redirect('/event/'+req.params.id+'/admin/email');
}