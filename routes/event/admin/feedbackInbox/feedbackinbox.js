var fs = require('fs')
	models = require('../../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../../util')
	, event = require('../../event')
	, async = require('async')
	, topic = require('./topic')
	, messages = require('./messages')
	, cards = require('./cards')
	, profiles = require('./profiles')
	, wall = require('./wall')
	, transport = require('../../../../config').transport
	, check = require('validator').check

exports.router = function (app) {
	var base = '/event/:id/admin/feedback/:fid/inbox';
	
	app.all(base+'/*', populateInbox)
		.get(base, populateInbox, show)
		.post(base+'/takeover', takeoverFP)
		.post(base+'/sendInbox', sendInbox)
	
	messages.router(app)
	cards.router(app)
	profiles.router(app)
	wall.router(app)
	topic.router(app)
}

function populateInbox (req, res, next) {
	if (!res.locals.feedbackProfile) {
		res.redirect('back')
		return;
	}
	
	var u = res.locals.feedbackProfile.user;
	
	async.parallel([
		function(cb) {
			models.Topic.find({ $and: [{ users: u._id }] }).sort('-lastUpdated').populate('users').exec(function(err, topics) {
				var messages = []
				for (var i = 0; i < topics.length; i++) {
					messages[i] = {
						//lastMessage: ....
						topic: topics[i]
					}
				}
				async.each(messages, function(message, done) {
					models.Message.findOne({ topic: message.topic._id }).sort('-timeSent').exec(function(err, msg) {
						if (err) throw err;
						
						message.lastMessage = msg; //msg can be null!
						done(null)
					})
				}, function(err) {
					res.locals.messages = messages;
					cb(null)
				})
			});
		},
		function(cb) {
			u.populate('receivedCards.user receivedCards.card', function(err) {
				if (err) throw err;
				
				cb(null)
			})
		},
		function(cb) {
			models.User.find({ savedProfiles: u._id }).exec(function(err, savers) {
				res.locals.savers = savers;
				cb(null)
			});
		},
		function (cb) {
			req.user.mailboxUnread = 0;
			req.user.save();
			cb(null)
		}
	], function(err) {
		if (err) throw err;
		
		next()
	})
}

function show (req, res) {
	res.format({
		html: function() {
			res.locals.topics = res.locals.messages;
			res.render('event/admin/feedbackInbox/all', { pageName: "Inbox Dashboard", title: "Inbox" });
		},
		json: function() {
			res.send({
				topics: topics
			})
		}
	})
}

function emailOrUser (req, res, next) {
	var email = req.body.field
		, u = res.locals.feedbackProfile.user
		, user = req.user
		, messages = res.locals.messages
		, uid;
	
	try {
		uid = mongoose.Types.ObjectId(req.body.field)
	} catch (e) {
		uid = null;
	}
	
	var complete = function (email, user) {
		try {
			check(email).isEmail();
		} catch (e) {
			res.send({
				status: 405,
				message: "Person has no email or email is malformed"
			})
			return;
		}
		
		next(email, user);
	}
	
	if (uid) {
		models.User.findById(uid, function(err, userToEmail) {
			if (err || !userToEmail) {
				res.send({ status: 404 })
				return;
			}
			
			complete(userToEmail.email, userToEmail);
		})
	} else {
		complete(email)
	}
}
function takeoverFP (req, res) {
	var u = res.locals.feedbackProfile.user
		, user = req.user;
	
	function complete(request, email, sendEmail) {

		if (sendEmail) {
			var options = {
				from: "EventMost <notifications@eventmost.com>",
				to: email,
				subject: "Invite to Take Over a Feedback Profile",
				//Sender: User.getName()
				//Profile Name: u.getName()
				//<a href='http://eventmost.com/takeProfile/"+request._id+"/"+request.secret+"'>
				html: " "
			}
			transport.sendMail(options, function(err, response) {
				if (err) throw err;
	
				console.log("Email sent.."+response.message)
			})

			// Record that an email was sent
			var emailNotification = new models.EmailNotification({
				to: u._id,
				email: email,
				type: "sentInvite"
			})
			emailNotification.save(function(err) {
				if (err) throw err;
			});
		}
		
		res.send({
			status: 200,
			message: "Done"
		})
	}
	
	emailOrUser(req, res, function(email, user) {
		if (!user) {
			request = new models.UserTakeoverRequest({
				email: email,
				requestedBy: req.user._id,
				event: res.locals.ev._id,
				takeoverUser: u._id
			})
			request.generateSecret();
			request.save(function(err) {
				if (err) throw err;
			});
			
			complete(request, email, true)
			return;
		}
		
		models.UserTakeoverRequest.findOne({
			takeoverUser: u._id,
			active: true
		}, function(err, request) {
			if (err != null || request == null) {
				request = new models.UserTakeoverRequest({
					user: user._id,
					requestedBy: req.user._id,
					event: res.locals.ev._id,
					takeoverUser: u._id
				})
				request.generateSecret();
				request.save(function (err) {
					if (err) throw err;
				});
				
				complete(request, email, true);
			} else {
				complete(request, email, false);
			}
		})
	})
}
function sendInbox (req, res) {
	emailOrUser(req, res, function(email) {
		sendInboxToEmail(req, res, email);
	})
}

function sendInboxToEmail (req, res, email) {
	var u = res.locals.feedbackProfile.user
		, user = req.user
		, messages = res.locals.messages
		, businessCards = res.locals.feedbackProfile.user.receivedCards
		, savers = res.locals.savers;

	var cardhtml;
	if (businessCards.length == 0)
		cardhtml = "<h3> No Cards Received </h3>"
	else if (businessCards.length >= 1)
		cardhtml = "<table border='0' cellpadding='0' cellspacing='0' width='100%' class='mcnImageGroupBlock' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody class='mcnImageGroupBlockOuter'><tr><td valign='top' style='padding: 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;' class='mcnImageGroupBlockInner'><table align='left' width='273' border='0' cellpadding='0' cellspacing='0' class='mcnImageGroupContentContainer' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td class='mcnImageGroupContent' valign='top' style='padding-left: 9px;padding-top: 0;padding-bottom: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><a href='http://eventmost.com/user/"+businessCards[0].from._id+"' title='' class='' target='_self' style='word-wrap: break-word;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><img alt='' src='http://eventmost.com/businessards/"+businessCards[0].card._id+".png' width='264' style='max-width: 516px;padding-bottom: 0;border: 0;outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;vertical-align: bottom;' class='mcnImage'></a></td></tr></tbody></table></td></tr></tbody></table>"
		if (businessCards.length >= 2)
				cardhtml = cardhtml+"<table border='0' cellpadding='0' cellspacing='0' width='100%' class='mcnImageGroupBlock' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody class='mcnImageGroupBlockOuter'><tr><td valign='top' style='padding: 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;' class='mcnImageGroupBlockInner'><table align='left' width='273' border='0' cellpadding='0' cellspacing='0' class='mcnImageGroupContentContainer' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td class='mcnImageGroupContent' valign='top' style='padding-left: 9px;padding-top: 0;padding-bottom: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><a href='http://eventmost.com/user/"+businessCards[1].from._id+"' title='' class='' target='_self' style='word-wrap: break-word;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><img alt='' src='http://eventmost.com/businessards/"+businessCards[1].card._id+".png' width='264' style='max-width: 516px;padding-bottom: 0;border: 0;outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;vertical-align: bottom;' class='mcnImage'></a></td></tr></tbody></table></td></tr></tbody></table>"
	var saverhtml;
	if (savers.length == 0)
		saverhtml = "<h3> No one saved this profile yet </h3>" 
	else if (savers.length >= 1)
		saverhtml = "<table align='left' border='0' cellpadding='0' cellspacing='0' class='mcnCaptionBottomContent' width='false' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td class='mcnCaptionBottomImageContent' align='left' valign='top' style='padding: 0 9px 9px 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><a href='http://eventmost.com/user/"+savers[1]._id+"' title='' class='' target='_self' style='word-wrap: break-word;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><img alt='' src='https://gallery.mailchimp.com/0c3c02b31e9cfa531662fd278/images/test.jpg' width='164' style='max-width: 960px;border: 0;outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;vertical-align: bottom;' class='mcnImage'></a></td></tr><tr><td class='mcnTextContent' valign='top' style='padding: 0 9px 0 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;color: #606060;font-family: Helvetica;font-size: 15px;line-height: 150%;text-align: left;' width='164'>"+savers[0].name+"</td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table>"
		if (savers.length >= 2)
			saverhtml = saverhtml+"<table align='left' border='0' cellpadding='0' cellspacing='0' class='mcnCaptionBottomContent' width='false' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td class='mcnCaptionBottomImageContent' align='left' valign='top' style='padding: 0 9px 9px 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><a href='http://eventmost.com/user/"+savers[1]._id+"' title='' class='' target='_self' style='word-wrap: break-word;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><img alt='' src='https://gallery.mailchimp.com/0c3c02b31e9cfa531662fd278/images/test.jpg' width='164' style='max-width: 960px;border: 0;outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;vertical-align: bottom;' class='mcnImage'></a></td></tr><tr><td class='mcnTextContent' valign='top' style='padding: 0 9px 0 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;color: #606060;font-family: Helvetica;font-size: 15px;line-height: 150%;text-align: left;' width='164'>"+savers[1].name+"</td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table>"
	async.map(messages, function(message, cb) {
		models.Message.find({
			topic: message.topic._id
		}).populate('sentBy')
		  .sort('-timeSent').exec(function(err, messages) {
			if (err) throw err;
			if (!messages[0].sentBy.avatar.length)
				var avatarUrl = "http://EventMost.com/images/default_speaker.svg";
			else
				var avatarUrl = messages[0].sentBy.avatar;
			var messagehtml;
			if (messages.length == 0)
				messagehtml="<h3>No Messages :(</h3>";
			else if (messages.length <= 1)
				messagehtml="<table border='0' cellpadding='0' cellspacing='0' class='mcnCaptionRightContentOuter' width=100% style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td valign='top' class='mcnCaptionRightContentInner' style='padding: 0 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><table align='left' border='0' cellpadding='0' cellspacing='0' class='mcnCaptionRightImageContentContainer' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td class='mcnCaptionRightImageContent' valign='top' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><a href='http://eventmost.com/user/"+messages[0].sentBy._id+"' title='' class='' target='_self' style='word-wrap: break-word;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><img alt='' src='"+avatarUrl+"' width='200' style='max-width: 200px;border: 0;outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;vertical-align: bottom;' class='mcnImage'></a></td></tr></tbody></table><table class='mcnCaptionRightTextContentContainer' align='right' border='0' cellpadding='0' cellspacing='0' width='264' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td valign='top' class='mcnTextContent' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;color: #606060;font-family: Helvetica;font-size: 15px;line-height: 150%;text-align: left;'>"+messages[0].message+"- <a href='http://eventmost.com/profile' target='_self' style='word-wrap: break-word;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;color: #6DC6DD;font-weight: normal;text-decoration: underline;'>"+messages[0].sentBy.getName()+"</a></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table>";
				if (messages.length <= 2)
					if (!messages[1].sentBy.avatar.length)
						var avatarUrl = "http://EventMost.com/images/default_speaker.svg";
					else
						var avatarUrl = messages[1].sentBy.avatar;
					messagehtml = messagehtml+"<table border='0' cellpadding='0' cellspacing='0' class='mcnCaptionRightContentOuter' width=100% style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td valign='top' class='mcnCaptionRightContentInner' style='padding: 0 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><table align='left' border='0' cellpadding='0' cellspacing='0' class='mcnCaptionRightImageContentContainer' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td class='mcnCaptionRightImageContent' valign='top' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><a href='http://eventmost.com/user/"+messages[1].sentBy._id+"' title='' class='' target='_self' style='word-wrap: break-word;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><img alt='' src='"+avatarUrl+"' width='200' style='max-width: 200px;border: 0;outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;vertical-align: bottom;' class='mcnImage'></a></td></tr></tbody></table><table class='mcnCaptionRightTextContentContainer' align='right' border='0' cellpadding='0' cellspacing='0' width='264' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td valign='top' class='mcnTextContent' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;color: #606060;font-family: Helvetica;font-size: 15px;line-height: 150%;text-align: left;'>"+messages[1].message+"-<a href='http://eventmost.com/profile' target='_self' style='word-wrap: break-word;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;color: #6DC6DD;font-weight: normal;text-decoration: underline;'>"+messages[1].sentBy.getName()+"</a></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table>";
			cb(null, messagehtml)
		})
	}, function(err, bodies) {
		var options = {
			from: "EventMost <notifications@eventmost.com>",
			to: email,
			subject: u.getName()+"'s Inbox",
			html: "<div style='background-color:#f6f6f6;'><!--[if gte mso 9]><v:background xmlns:v='urn:schemas-microsoft-com:vml' fill='t'><v:fill type='tile' src='http://i.imgur.com/n8Q6f.png' color='#f6f6f6'/></v:background><![endif]--><table height='100%' width='100%' cellpadding='0' cellspacing='0' border='0' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td valign='top' align='left' background='http://eventmost.com/images/logo.svg' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><center><table align='center' border='0' cellpadding='0' cellspacing='0' height='100%' width='100%' id='bodyTable' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;margin: 0;padding: 0;background-color: #F2F2F2;height: 100% !important;width: 100% !important;'><tbody><tr><td align='center' valign='top' id='bodyCell' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;margin: 0;padding: 0;border-top: 0;height: 100% !important;width: 100% !important;'><!-- BEGIN TEMPLATE // --><table border='0' cellpadding='0' cellspacing='0' width='100%' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td align='center' valign='top' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><!-- BEGIN HEADER // --><table border='0' cellpadding='0' cellspacing='0' width='100%' id='templateHeader' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;background-color: #FFFFFF;border-top: 0;border-bottom: 0;'><tbody><tr><td align='center' valign='top' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><table border='0' cellpadding='0' cellspacing='0' width='600' class='templateContainer' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td valign='top' class='headerContainer' style='padding-top: 10px;padding-bottom: 10px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><table border='0' cellpadding='0' cellspacing='0' width='100%' class='mcnImageBlock' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody class='mcnImageBlockOuter'><tr><td valign='top' style='padding: 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;' class='mcnImageBlockInner'><table align='left' width='100%' border='0' cellpadding='0' cellspacing='0' class='mcnImageContentContainer' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td class='mcnImageContent' valign='top' style='padding-right: 9px;padding-left: 9px;padding-top: 0;padding-bottom: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><img align='left' alt='' src='http://eventmost.com/images/logo.svg' width='312' style='max-width: 312px;padding-bottom: 0;display: inline !important;vertical-align: bottom;border: 0;outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;' class='mcnImage'></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table><!-- // END HEADER --></td></tr><tr><td align='center' valign='top' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><!-- BEGIN BODY // --><table border='0' cellpadding='0' cellspacing='0' width='100%' id='templateBody' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;background-color: #FFFFFF;border-top: 0;border-bottom: 0;'><tbody><tr><td align='center' valign='top' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><table border='0' cellpadding='0' cellspacing='0' width='600' class='templateContainer' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td valign='top' class='bodyContainer' style='padding-top: 10px;padding-bottom: 10px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><table border='0' cellpadding='0' cellspacing='0' width='100%' class='mcnTextBlock' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody class='mcnTextBlockOuter'><tr><td valign='top' class='mcnTextBlockInner' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><table align='left' border='0' cellpadding='0' cellspacing='0' width='600' class='mcnTextContentContainer' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td valign='top' class='mcnTextContent' style='padding: 9px 18px;color: #532437;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;font-family: Helvetica;font-size: 15px;line-height: 150%;text-align: left;'>Thanks taking part in your most recent event. &nbsp;Below is some correspondence, questions, or feedback you received from the attendees:</td></tr></tbody></table></td></tr></tbody></table><table border='0' cellpadding='0' cellspacing='0' width='100%' class='mcnTextBlock' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody class='mcnTextBlockOuter'><tr><td valign='top' class='mcnTextBlockInner' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><table align='left' border='0' cellpadding='0' cellspacing='0' width='600' class='mcnTextContentContainer' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td valign='top' class='mcnTextContent' style='padding: 9px 18px;color: #532437;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;font-family: Helvetica;font-size: 15px;line-height: 150%;text-align: left;'><h1 class='mc-toc-title' style='margin: 0;padding: 0;display: block;font-family: Helvetica;font-size: 40px;font-style: normal;font-weight: bold;line-height: 125%;letter-spacing: -1px;text-align: left;color: #606060 !important;'><strong>Private Messages:</strong></h1></td></tr></tbody></table></td></tr></tbody></table><table border='0' cellpadding='0' cellspacing='0' width='100%' class='mcnCaptionBlock' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody class='mcnCaptionBlockOuter'><tr><td class='mcnCaptionBlockInner' valign='top' style='padding: 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'>"+bodies.join('<br/>')+"<table border='0' cellpadding='0' cellspacing='0' width='100%' class='mcnTextBlock' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody class='mcnTextBlockOuter'><tr><td valign='top' class='mcnTextBlockInner' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><table align='left' border='0' cellpadding='0' cellspacing='0' width='600' class='mcnTextContentContainer' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td valign='top' class='mcnTextContent' style='padding: 9px 18px;color: #532437;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;font-family: Helvetica;font-size: 15px;line-height: 150%;text-align: left;'><h1 class='mc-toc-title' style='margin: 0;padding: 0;display: block;font-family: Helvetica;font-size: 40px;font-style: normal;font-weight: bold;line-height: 125%;letter-spacing: -1px;text-align: left;color: #606060 !important;'>Business Cards Received:&nbsp;</h1></td></tr></tbody></table></td></tr></tbody></table>"+cardhtml+"<table border='0' cellpadding='0' cellspacing='0' width='100%' class='mcnTextBlock' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody class='mcnTextBlockOuter'><tr><td valign='top' class='mcnTextBlockInner' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><table align='left' border='0' cellpadding='0' cellspacing='0' width='600' class='mcnTextContentContainer' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td valign='top' class='mcnTextContent' style='padding: 9px 18px;color: #532437;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;font-family: Helvetica;font-size: 15px;line-height: 150%;text-align: left;'><h1 class='mc-toc-title' style='margin: 0;padding: 0;display: block;font-family: Helvetica;font-size: 40px;font-style: normal;font-weight: bold;line-height: 125%;letter-spacing: -1px;text-align: left;color: #606060 !important;'>People who saved your profile:&nbsp;</h1></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table><!-- // END BODY --></td></tr><tr><td align='center' valign='top' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><!-- BEGIN COLUMNS // --><table border='0' cellpadding='0' cellspacing='0' width='100%' id='templateColumns' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;background-color: #FFFFFF;border-top: 0;border-bottom: 0;'><tbody><tr><td align='center' valign='top' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><table border='0' cellpadding='0' cellspacing='0' width='600' class='templateContainer' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td align='left' valign='top' class='columnsContainer' width='33%' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><table border='0' cellpadding='0' cellspacing='0' width='100%' class='templateColumn' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td valign='top' class='leftColumnContainer' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><table border='0' cellpadding='0' cellspacing='0' width='100%' class='mcnCaptionBlock' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody class='mcnCaptionBlockOuter'><tr><td class='mcnCaptionBlockInner' valign='top' style='padding: 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'>"+saverhtml+"</td></tr></tbody></table><!-- // END COLUMNS --></td></tr><tr><td align='center' valign='top' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><!-- BEGIN FOOTER // --><table border='0' cellpadding='0' cellspacing='0' width='100%' id='templateFooter' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;background-color: #F2F2F2;border-top: 0;border-bottom: 0;'><tbody><tr><td align='center' valign='top' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><table border='0' cellpadding='0' cellspacing='0' width='600' class='templateContainer' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td valign='top' class='footerContainer' style='padding-top: 10px;padding-bottom: 10px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><table border='0' cellpadding='0' cellspacing='0' width='100%' class='mcnTextBlock' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody class='mcnTextBlockOuter'><tr><td valign='top' class='mcnTextBlockInner' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><table align='left' border='0' cellpadding='0' cellspacing='0' width='600' class='mcnTextContentContainer' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td valign='top' class='mcnTextContent' style='padding: 9px 18px;color: #532437;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;font-family: Helvetica;font-size: 11px;line-height: 125%;text-align: left;'><h1 class='mc-toc-title' style='margin: 0;padding: 0;display: block;font-family: Helvetica;font-size: 40px;font-style: normal;font-weight: bold;line-height: 125%;letter-spacing: -1px;text-align: left;color: #606060 !important;'>To fully open this profile, simply click on the link <a href='http://eventmost.com' target='_self' style='word-wrap: break-word;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;color: #606060;font-weight: normal;text-decoration: underline;'>here.</a></h1></td></tr></tbody></table></td></tr></tbody></table><table border='0' cellpadding='0' cellspacing='0' width='100%' class='mcnTextBlock' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody class='mcnTextBlockOuter'><tr><td valign='top' class='mcnTextBlockInner' style='mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><table align='left' border='0' cellpadding='0' cellspacing='0' width='600' class='mcnTextContentContainer' style='border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;'><tbody><tr><td valign='top' class='mcnTextContent' style='padding-top: 9px;padding-right: 18px;padding-bottom: 9px;padding-left: 18px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;color: #606060;font-family: Helvetica;font-size: 11px;line-height: 125%;text-align: left;'><em>Copyright &copy; 2013 EventMost, All rights reserved.</em><br><br><br><a href='http://eventmost.us3.list-manage2.com/unsubscribe?u=0c3c02b31e9cfa531662fd278&amp;id=2e59d23858&amp;e=[UNIQID]&amp;c=f8d4fe64dd' class='utilityLink' style='word-wrap: break-word;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;color: #606060;font-weight: normal;text-decoration: underline;'>Unsubscribe from this list</a>&nbsp;&nbsp;&nbsp;<a href='http://eventmost.us3.list-manage.com/profile?u=0c3c02b31e9cfa531662fd278&amp;id=2e59d23858&amp;e=[UNIQID]' class='utilityLink' style='word-wrap: break-word;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;color: #606060;font-weight: normal;text-decoration: underline;'>Update subscription preferences</a>&nbsp;<br><br></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table><!-- // END FOOTER --></td></tr></tbody></table><!-- // END TEMPLATE --></td></tr></tbody></table></center></td></tr></tbody></table></div>"
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
}