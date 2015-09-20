var fs = require('fs')
	, models = require('../../models')
	, mongoose = require('mongoose')
	, util = require('../../util')
	, async = require('async')
	, inbox = require('./index')

exports.router = function (app) {
	app.get('/inbox/messages', showMessages)
		.get('/inbox/messages/new', doNewMessage)
		.post('/inbox/messages/new', doNewMessage)
		.get('/inbox/message/:id', getMessage, showMessage)
		.post('/inbox/message/:id', getMessage, postMessage)
}

function getMessage (req, res, next) {
	var id = req.params.id;
	try {
		id = mongoose.Types.ObjectId(id);
	} catch (e) {
		res.redirect('/messages');
		return;
	}
	
	var message = null;
	for (var i = 0; i < res.locals.messages.length; i++) {
		var msg = res.locals.messages[i].topic;
		if (msg._id.equals(id)) {
			message = msg;
			break;
		}
	}
	
	if (!message) {
		res.redirect('/messages')
		return;
	}
	
	
	models.Message.find({
		topic: message._id
	}).populate('sentBy')
	  .sort('-timeSent').exec(function(err, messages) {
		if (err) throw err;
		
		res.locals.message = message;
		res.locals.messages = messages;
		next()
	})
}

function showMessage (req, res) {
	var otherUser = null;
	for (var i = 0; i < res.locals.message.users.length; i++) {
		if (!req.user._id.equals(res.locals.message.users[i]._id)) {
			otherUser = res.locals.message.users[i];
			break;
		}
	}
	
	var name = "Private Message"
	if (otherUser)
		name = "PM to "+otherUser.getName();
		
	res.format({
		html: function() {
			res.render('inbox/message', { pageName: name, title: name })
		},
		json: function() {
			res.send({
				message: res.locals.message,
				messages: res.locals.messages
			})
		}
	})
}

function postMessage (req, res) {
	var id = req.params.id;
	var text = req.body.message;

	console.log(id + "----" + text);
	
	// check if can make messages
	if (req.session.loggedin_as_user_locals != null && req.session.loggedin_as_user_locals.inbox_send_disabled === true) {
		res.format({
			html: function() {
				res.redirect('/messages');
			},
			json: function() {
				res.send({
					status: 404,
					message: "Disabled"
				})
			}
		})
		return;
	}
	
	if (text.length == 0) {
		res.format({
			html: function() {
				res.redirect('/messages');
			},
			json: function() {
				res.send({
					status: 403,
					message: "Too short"
				})
			}
		})
		return;
	}
	
	var message = res.locals.message;
	var otherUser = null;
	if (message) {
		var isUser = false;
		for (var i = 0; i < message.users.length; i++) {
			if (message.users[i]._id.equals(req.user._id)) {
				isUser = true;
				break;
			}
		}
		
		if (!isUser) {
			req.session.flash.push("Unauthorized");
			res.redirect('/')
			return;
		}
		
		//Updating User's notification
		for (var i = 0; i < message.users.length; i++) {
			var u = message.users[i];
			
			// dont update this user
			if (u._id.equals(req.user._id)) continue;
			
			u.mailboxUnread++;
			u.save();
			otherUser = u;
		}

		message.lastUpdated = Date.now();
		message.save(function(err) {
			if (err) throw err;
		});
		
		var msg = new models.Message({
			topic: message._id,
			message: text,
			read: false,
			timeSent: Date.now(),
			sentBy: req.user._id
		})
		
		console.log('going for sockets');
		var notAlertedUsers = inbox.pushMessageToSockets({
			message: {
				_id: msg._id,
				topic: msg.topic,
				message: msg.message,
				read: msg.read,
				timeSent: msg.timeSent,
				sentBy: req.user
			},
			topic: message
		});
		
		/*for (var i = 0; i < notAlertedUsers.length; i++) {
			var u = notAlertedUsers[i];
			// These people are not connected by WS, so they're offline..
			if (u.notification.email.privateMessages) {
				inbox.emailMessageNotification(u, req.user, "inbox", "Message from <strong>"+req.user.getName()+"</strong>: "+msg.message);
			}
		}*/

		async.parallel([
		
			function (cb) {
				console.log("saving msg");
				msg.save();
				cb();
			},
			function (cb) {
				
				//Send email to Feedback Profile...

				if(otherUser.isFeedbackProfile == true){
					var commentHTML = '';
					var feedbackEventId = otherUser.feedbackProfileEvent;
					
					var email = otherUser.email;
					var username = req.user.name;
					var user_id = req.user._id;
					var user_category = '';
					var user_position = req.user.position;
					var replylink = '';
					var profileImg = ((req.user.avatar != '') ? 'http://dev.eventmost.com'+req.user.avatar : 'http://dev.eventmost.com/images/default_speaker-purple.png');

					//commentString = '<div style="float:left; width:100%; margin-bottom:10px;" > <div style=" background:#E6E7E8; margin-left:10px; width:32%; float:left; padding:0px 10px 0px 0px;border-radius:110px; margin-bottom:10px; margin-right:10px;"> <div><div style="width:90px; height:90px !important; float:left"><img src="'+profileImg+'" width="90px" height="90px" style="border-radius:110px; max-width:100% !important; min-height: auto !important; display: block !important;" alt="'+username+'" title="'+username+'" /></div></div> <div style=" float:left ; margin:20px 0px 0px 20px"> <div class="font20a nspacer font-exception" style=" font-weight:bold">'+username+'</div> <div style="float:left; font-weight:bold"><div class="font20a nspacer font-exception" >'+user_category+'</div></div> <div class="bold break font-change font-attendee font-exception"> '+user_position+'</div> </div> </div> <div style=" margin-top:10px;">'+thisComment+'</div> <div style=" margin-top:10px"><a href="'+replylink+'" style="color:#0992A3; font-weight:bold"><img src="http://dev.eventmost.com/images/reply.png" style="padding-right:10px " width="40" align="left"/> <div style="margin:10px 0px 0px 0px; float:left">Reply</div></a></div> </div>';
					commentString = '<tr> <td><table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td><table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td width="52%"><div style=" margin-left:10px; padding:0px 10px 0px 0px;border-radius:90px; margin-bottom:10px; margin-right:10px;"> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td width="40%" align="center" style="border-right: 1px solid #E6E7E8" ><img src="'+profileImg+'" height="90" max-width="100%" /></td> <td valign="middle" width="60%" background="" align="left" ><div style="background: #e6e7e8 0 0; border-radius: 0 90px 90px 0; float: left; margin: 0 0 0 20px; padding: 20px 10px; width: 78%;"> <div class="bold font-exception" style=" font-size:14px; font-weight:bold">'+username+'</div> <div style="float:left;"> <div class=" font-exception" >'+user_category+'</div> </div> <div class=" break font-change font-attendee font-exception" style="float:left; clear:both; font-size:14px"> '+user_position+' </div> </div></td> </tr> </table> </div></td> <td width="48%" ><div style=" margin-top:10px; padding-right:10px">'+text+'</div> <div style=" margin-top:10px"><a href="'+replylink+'" style="color:#0992A3; font-weight:bold"><img src="http://dev.eventmost.com/images/reply.png" style="padding-right:10px " width="40" align="left"/> <div style="margin:10px 0px 0px 0px; float:left">Reply</div> </a></div></td> </tr> </table></td> </tr> </table></td> </tr>'
					commentHTML+= commentString;

					models.Event.findOne({"_id": mongoose.Types.ObjectId(feedbackEventId)}).populate("avatar").exec(function(err, ev) {
						console.log(ev);
						var eventAvatar = String(ev.avatar.url);
					    eventAvatar = ((eventAvatar.indexOf("http") > -1) ? eventAvatar : 'http://dev.eventmost.com'+eventAvatar);
					    

					    
						
						var htmlcontent = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> <html xmlns="http://www.w3.org/1999/xhtml"> <head> <meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> <title>newsletter</title> <link href="http://dev.eventmost.com/css/bootstrap-eventmost.css" rel="stylesheet" type="text/css" /> </head> <body style="font-family:Arial, Helvetica, sans-serif"> <table width="700" border="0" cellspacing="0" cellpadding="0" bgcolor="#F7F7F7" align="center" style="padding:5px 0px"> <tr> <td><table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td><img src="http://dev.eventmost.com/images/logo.png" style="text-align:center ; margin:0px auto; display:block; margin-bottom:10px " width="280px" height="58px" /></td> </tr> <tr> <td><table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td bgcolor="#0992A3" style="padding:10px 10px 10px 10px; font-size:22px; color:#FFFFFF">SSCG Africa Annual Economic & Entrepreneurship Conference</td> </tr> <tr> <td style="padding:10px 10px 10px 10px; font-size:16px; color:#000"><p><img src="'+eventAvatar+'" style="padding:0px 15px 10px 0px; float:left" width="150" />'+ev.description+'</p></td> </tr> <tr> <td style="padding:10px 10px 10px 10px; font-size:20px; color:#FED298; text-align:center"><p>Dear Speaker, Following message has been received by one of the attendee you have recently interacted with.</p></td> </tr> '+commentHTML+' </table></td> </tr> <tr bgcolor="#542437"> <td style="color:#FFFFFF; padding:20px 10px;font-size:14px; text-align:center">Copyright &copy; 2015 <b>EventMost</b> | <a style=" color:#FFFFFF; text-decoration:none; " href="/contact">Contact us</a></td> </tr> </table></td> </tr> </table> </body> </html>';
						var options = {
								from: "EventMost <noreply@eventmost.com>",
								to: " <"+email+">",
								subject: "Message From EventMost User",
								html: htmlcontent
							}



						config.transport.sendMail(options, function(err, response) {
							if (err) throw err;
							
							cb();
						})
					});

					

				}else{
					cb();	
				}
				
			}
		], function(err) {
			if (err) throw err;
			console.log('generating response');
			res.format({
				html: function() {
					res.redirect('/messages')
				},
				json: function() {
					res.send({
						status: 200,
						sent: true
					})
				}
			});
		});
		
	} else {
		// 404
		
		res.format({
			html: function() {
				res.status(403);
				res.redirect('/messages')
			},
			json: function() {
				res.send({
					status: 404
				})
			}
		})
		
	}
}

function doNewMessage (req, res) {
	var to;
	if (req.query.to != null) {
		try {
			to = mongoose.Types.ObjectId(req.query.to);
		} catch (e) {
			to = null;
		}
	}
	
	// check if can make messages
	if (req.session.loggedin_as_user_locals != null && req.session.loggedin_as_user_locals.inbox_send_disabled === true) {
		res.format({
			html: function() {
				res.redirect('/inbox');
			},
			json: function() {
				res.send({
					status: 404,
					message: "Disabled"
				})
			}
		})
		return;
	}
	
	models.User.findOne({ _id: to }, function(err, user) {
		if (!user) {
			res.format({
				html: function() {
					res.redirect('back');
				},
				json: function() {
					res.send(400, {
						message: 'No Such User'
					});
				}
			});
			
			return;
		}

	//----------------------------------------
			
	var loggedInUserId = mongoose.Types.ObjectId(req.user._id);
	var query = [{ users: {$in:[loggedInUserId, to]} }];
    var isTopicExist = false;

    // Fetch My Topics.
    models.Topic.find(query)
        .select('users lastUpdated')
        .sort('lastUpdated')
        .exec(function (err, topics) {

        	for(var x=0; x < topics.length; x++) {
        		//console.log(topic)
        		var list = topics[x].users;

        		if(list.indexOf(loggedInUserId) > -1 && list.indexOf(to) > -1){
        			//Topic already exist...
        			console.log("topic exist");
        			isTopicExist = true;
        			break;
        		}
        	}

        	if(isTopicExist == false){
        		//Topic doesn't exist...
				console.log("topic doesnt exist");
    			var topic = new models.Topic({
					lastUpdated: Date.now(),
					users: [req.user._id, user._id]
				})
				topic.save();
        	}
        	res.format({
				html: function() {
					res.redirect('/messages');
				},
				json: function() {
					res.send({
						status: 200,
						message: {
							lastMessage: '',
							topic: {
								users: [req.user, user],
								lastUpdated: topic.lastUpdated,
								_id: topic._id
							}
						}
					})
				}
			})
        });	
	});
}

function showMessages (req, res) {
	res.format({
		html: function() {
			res.render('inbox/messages', { pageName: "Private Messages", title: "Private Messages" });
		},
		json: function() {
			res.send({
				messages: res.locals.messages
			})
		}
	})
}