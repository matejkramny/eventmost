var fs = require('fs'),
	models = require('../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../util')
	, event = require('../event')
	, feedbackinbox = require('./feedbackInbox')
	, config = require('../../../config')
	, async = require('async')
	, inbox = require('../../inbox/index')
	, jade = require('jade')
	, transport = config.transport
	, check = require('validator').check

exports.router = function (app) {
	app.get('/event/:id/admin/feedback/:fid/accessInbox', accessInbox)
		.post('/event/:id/admin/feedback/:fid/sendInbox', sendInbox)
}

function accessInbox (req, res) {
	req.session.loggedin_as_user = req.user._id;
	req.session.loggedin_as_user_referrer = req.get('referrer');
	req.session.loggedin_as_user_restrict = new RegExp("^\/(inbox|search|event\/"+res.locals.ev._id+"\/admin\/feedback\/"+res.locals.feedbackProfile._id+"\/sendInbox)");
	req.session.loggedin_as_user_redirect_restricted = "/inbox";
	req.session.loggedin_as_user_locals = {
		hide_bar_right: true,
		loggedin_as_user_message: "<strong>"+res.locals.feedbackProfile.user.getName()+"</strong>'s Inbox",
		loggedin_as_user_return_message: "Back to The Event",
		inbox_send_disabled: true,
		inbox_send_to: "/event/"+res.locals.ev._id+"/admin/feedback/"+res.locals.feedbackProfile._id+"/sendInbox"
	}
	
	req.login(res.locals.feedbackProfile.user, function(err) {
		res.redirect('/inbox');
	})
}

function sendInbox (req, res) {
	var u = res.locals.feedbackProfile.user
			, user = req.user
			, email = req.body.email
	
	try {
		check(email).isEmail()
	} catch (e) {
		res.send({
			status: 400,
			message: "Invalid Email Address"
		});
		return;
	}
	
	var email = req.body.email;
	// A bit of a hack to extract inbox from a user..
	var populatedInbox = { };
	inbox.populateInbox({user: u}, { locals: populatedInbox }, function() {
		messages = populatedInbox.messages;
		
		async.map(messages, function(message, cb) {
			models.Message.find({
				topic: message.topic._id
			}).populate('sentBy')
			  .sort('-timeSent').exec(function(err, messages) {
				if (err) throw err;
		
				cb(null, {
					message: message,
					messages: messages
				})
			})
		}, function(err, msgs) {
			var html = jade.renderFile(config.path + '/views/email/feedbackProfileInbox.jade', {
				messages: msgs,
				user: user,
				feedbackProfile: res.locals.feedbackProfile,
				savers: populatedInbox.savers
			});
	
			var options = {
				from: "EventMost <notifications@eventmost.com>",
				to: email,
				subject: u.getName()+"'s Inbox",
				html: html
			}
			if (!config.transport_enabled) {
				console.log("Transport disabled!")
				console.log(options);
				
				res.send({
					status: 200,
					message: "Done"
				})
				
				return;
			}
			
			transport.sendMail(options, function(err, response) {
				if (err) throw err;

				console.log("Email sent.."+response.message)
			})

			// Record that an email was sent
			var emailNotification = new models.EmailNotification({
				to: u._id,
				email: email,
				type: "sentInbox"
			})
			emailNotification.save(function(err) {
				if (err) throw err;
			});

			res.send({
				status: 200,
				message: "Done"
			})
		})
	})
}