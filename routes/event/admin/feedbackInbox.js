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
		.get('/messages/preview', inbox.populateInbox, previewFeedback)
		.post('/messages/feedback/sendFeedback', inbox.populateInbox, sendFeedback)
}

function sendFeedback(req, res){
	var email = req.body.email;
	if(!email || email == ''){
		res.send({
			status: 404
		});
	}else{

		var commentString = '';
		var commentHTML = '';
		
		all_messages = res.locals.messages;
		async.each(all_messages, function(message, callback){
			models.Message.find({
				topic: message.topic._id
			}).populate('sentBy')
			  .sort('-timeSent').exec(function(err, messages) {
				if (err) throw err;
				
				async.each(messages, function(thisMsg, cb){
					//console.log(thisMsg.sentBy._id+" -- "+req.user._id);
					if(String(thisMsg.sentBy._id) != String(req.user._id)){
						//console.log(thisMsg);
						
						var item = {
							name: thisMsg.sentBy.name,
							company : thisMsg.sentBy.company,
							position: thisMsg.sentBy.position,
							avatar: "http://eventmost.com"+((thisMsg.sentBy.avatar != '') ? thisMsg.sentBy.avatar : '/images/default_speaker.svg'),
							message: thisMsg.message,
							card: '',
							replylink: 'http://eventmost.com/reply-feedback-message/'+thisMsg._id+'/'+thisMsg.sentBy._id+'/'+req.user._id
						}
						commentString = '<tr> <td><table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td><table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td width="52%"><div style=" margin-left:10px; padding:0px 10px 0px 0px;border-radius:90px; margin-bottom:10px; margin-right:10px;"> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td width="40%" align="center" style="border-right: 1px solid #E6E7E8" ><img src="'+item.avatar+'" height="90" max-width="100%" /></td> <td valign="middle" width="60%" background="" align="left" ><div style="background: #e6e7e8 0 0; border-radius: 0 90px 90px 0; float: left; margin: 0 0 0 20px; padding: 20px 10px; width: 78%;"> <div class="bold font-exception" style=" font-size:14px; font-weight:bold">'+item.name+'</div> <div style="float:left;"> <div class=" font-exception" >'+item.position+'</div> </div> <div class=" break font-change font-attendee font-exception" style="float:left; clear:both; font-size:14px"> '+item.company+' </div> </div></td> </tr> </table> </div></td> <td width="48%" ><div style=" margin-top:10px; padding-right:10px">'+item.message+'</div> <div style=" margin-top:10px"><a href="'+item.replylink+'" style="color:#0992A3; font-weight:bold"><img src="http://eventmost.com/images/reply.png" style="padding-right:10px " width="40" align="left"/> <div style="margin:10px 0px 0px 0px; float:left">Reply</div> </a></div></td> </tr> </table></td> </tr> </table></td> </tr>'
						commentHTML+= commentString;

					}
					cb();
				});
				callback();
			});
			 
		}, function(err) {
			//console.log(items)
			//res.render('event/newsletter/preview', { pageName: "Preview Page", title: "Newletter Preview", items: items });
			if(res.locals.receivedCards && res.locals.receivedCards.length > 0){
				commentString = '<tr><td><center><h2>Business Cards</h2></center></td></tr>'
				commentHTML+= commentString;

				res.locals.receivedCards.forEach(function (thiscard){
					var item = {
						name: thiscard.from.name,
						company : thiscard.from.company,
						position: thiscard.from.position,
						avatar: "http://eventmost.com"+((thiscard.from.avatar != '') ? thiscard.from.avatar : '/images/default_speaker.svg'),
						message: '',
						card: "http://eventmost.com/businesscards/"+thiscard.card._id+".png"
					}
					commentString = '<tr> <td><table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td><table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td width="52%"><div style=" margin-left:10px; padding:0px 10px 0px 0px;border-radius:90px; margin-bottom:10px; margin-right:10px;"> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td width="40%" align="center" style="border-right: 1px solid #E6E7E8" ><img src="'+item.avatar+'" height="90" max-width="100%" /></td> <td valign="middle" width="60%" background="" align="left" ><div style="background: #e6e7e8 0 0; border-radius: 0 90px 90px 0; float: left; margin: 0 0 0 20px; padding: 20px 10px; width: 78%;"> <div class="bold font-exception" style=" font-size:14px; font-weight:bold">'+item.name+'</div> <div style="float:left;"> <div class=" font-exception" >'+item.position+'</div> </div> <div class=" break font-change font-attendee font-exception" style="float:left; clear:both; font-size:14px"> '+item.company+' </div> </div></td> </tr> </table> </div></td> <td width="48%" ><img src="'+item.card+'" style="max-height:200px; width:100%" /></td> </tr> </table></td> </tr> </table></td> </tr>'
					commentHTML+= commentString;
				})

				
				//res.render('event/newsletter/preview', { pageName: "Preview Page", title: "Newletter Preview", items: items, business_cards: business_cards });
			}

			var htmlcontent = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> <html xmlns="http://www.w3.org/1999/xhtml"> <head> <meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> <title>newsletter</title> <link href="http://eventmost.com/css/bootstrap-eventmost.css" rel="stylesheet" type="text/css" /> </head> <body style="font-family:Arial, Helvetica, sans-serif"> <table width="700" border="0" cellspacing="0" cellpadding="0" bgcolor="#F7F7F7" align="center" style="padding:5px 0px"> <tr> <td><table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td><img src="http://eventmost.com/images/logo.png" style="text-align:center ; margin:0px auto; display:block; margin-bottom:10px " width="280px" height="58px" /></td> </tr> <tr> <td><table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td bgcolor="#0992A3" style="padding:10px 10px 10px 10px; font-size:22px; color:#FFFFFF">Feedback From Attendees</td> </tr><tr> <td style="padding:10px 10px 10px 10px; font-size:20px; color:#FED298; text-align:center"><p>Dear Speaker, We have selected following questions for you to send a reply if you want.</p></td> </tr> '+commentHTML+' </table></td> </tr> <tr bgcolor="#542437"> <td style="color:#FFFFFF; padding:20px 10px;font-size:14px; text-align:center">Copyright &copy; 2015 <b>EventMost</b> | <a style=" color:#FFFFFF; text-decoration:none; " href="/contact">Contact us</a></td> </tr> </table></td> </tr> </table> </body> </html>';
			var options = {
				from: "EventMost <noreply@eventmost.com>",
				to: " <"+email+">",
				subject: "Feedback Newsletter ",
				html: htmlcontent
			}

			config.transport.sendMail(options, function(err, response) {
				if (err) throw err;
				
				res.send({
					status: 200
				});
			});
		})
	}
}

function previewFeedback(req, res){
	
	//console.log(req.user.name);
	//console.log(res.locals);
	var items = [];
	var business_cards = [];
	all_messages = res.locals.messages;
	async.each(all_messages, function(message, callback){
		models.Message.find({
			topic: message.topic._id
		}).populate('sentBy')
		  .sort('-timeSent').exec(function(err, messages) {
			if (err) throw err;
			
			async.each(messages, function(thisMsg, cb){
				//console.log(thisMsg.sentBy._id+" -- "+req.user._id);
				if(String(thisMsg.sentBy._id) != String(req.user._id)){
					//console.log(thisMsg);
					
					var item = {
						name: thisMsg.sentBy.name,
						company : thisMsg.sentBy.company,
						position: thisMsg.sentBy.position,
						avatar: ((thisMsg.sentBy.avatar != '') ? thisMsg.sentBy.avatar : '/images/default_speaker.svg'),
						message: thisMsg.message,
						card: ''
					}
					items.push(item);

				}
				cb();
			});
			callback();
		});
		 
	}, function(err) {
		//console.log(items)
		//res.render('event/newsletter/preview', { pageName: "Preview Page", title: "Newletter Preview", items: items });
		if(res.locals.receivedCards && res.locals.receivedCards.length > 0){
			
			res.locals.receivedCards.forEach(function (thiscard){
				var item = {
					name: thiscard.from.name,
					company : thiscard.from.company,
					position: thiscard.from.position,
					avatar: ((thiscard.from.avatar != '') ? thiscard.from.avatar : '/images/default_speaker.svg'),
					message: '',
					card: "/businesscards/"+thiscard.card._id+".png"
				}
				business_cards.push(item);
			})

			
			res.render('event/newsletter/preview', { pageName: "Preview Page", title: "Newletter Preview", items: items, business_cards: business_cards });
		}else{
			res.render('event/newsletter/preview', { pageName: "Preview Page", title: "Newletter Preview", items: items });
		}

	})
}

function accessInbox (req, res) {
	req.session.loggedin_as_user = req.user._id;
	req.session.loggedin_as_user_referrer = req.get('referrer');
	req.session.loggedin_as_user_restrict = new RegExp("^\/(inbox|messages|search|event\/"+res.locals.ev._id+"\/admin\/feedback\/"+res.locals.feedbackProfile._id+"\/sendInbox)");
	req.session.loggedin_as_user_redirect_restricted = "/messages";
	req.session.loggedin_as_user_locals = {
		hide_bar_right: true,
		loggedin_as_user_message: "<strong>"+res.locals.feedbackProfile.user.getName()+"</strong>'s Inbox",
		loggedin_as_user_return_message: "Back to The Event",
		inbox_send_disabled: true,
		inbox_send_to: "/event/"+res.locals.ev._id+"/admin/feedback/"+res.locals.feedbackProfile._id+"/sendInbox"
	}
	
	req.login(res.locals.feedbackProfile.user, function(err) {
		res.redirect('/messages');
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