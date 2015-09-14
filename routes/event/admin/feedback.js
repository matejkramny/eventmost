var fs = require('fs'),
	models = require('../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../util')
	, event = require('../event')
	, feedbackinbox = require('./feedbackInbox')
	, config = require('../../../config')
	, async = require('async')

exports.router = function (app) {
	app.get('/event/:id/admin/feedback', eventFeedbackProfile)
		.get('/event/:id/admin/feedback/new', newFeedbackProfile)
		.post('/event/:id/admin/feedback/edit', getProfile, doEditFeedbackProfile)
		.get('/event/:id/admin/feedback/:fid', getProfile, editFeedbackProfile)
		.all('/event/:id/admin/feedback/:fid/*', getProfile)
		.get('/event/:id/admin/sendnewsletter', sendnewsletter)

		feedbackinbox.router(app)
}

function eventFeedbackProfile (req, res) {
	res.render('event/admin/feedback', { title: "Feedback Profile", ev: res.locals.ev, feedbackpage: true })
}

function newFeedbackProfile (req, res) {
	res.render('event/admin/editFeedback', { title: "Create a new Feedback Profile" });
}

function getProfile (req, res, next) {
	var fid = req.params.fid || req.body._id;
	var ev = res.locals.ev;
	
	try {
		fid = mongoose.Types.ObjectId(fid)
	} catch (e) {
		next()
		return;
	}
	
	var attendee;
	for (var i = 0; i < ev.attendees.length; i++) {
		var att = ev.attendees[i];
		if (att._id.equals(fid) && att.user.isFeedbackProfile && att.user.feedbackProfileEvent.equals(ev._id)) {
			attendee = ev.attendees[i];
			break;
		}
	}
	
	res.locals.feedbackProfile = attendee;
	next()
}

function editFeedbackProfile (req, res) {
	if (!res.locals.feedbackProfile) {
		res.redirect('/event/'+res.locals.ev._id+'/admin/feedback')
		return;
	}
	
	res.render('event/admin/editFeedback', { title: "Edit Feedback Profile "+res.locals.feedbackProfile.user.getName() });
}

function doEditFeedbackProfile (req, res) {
	var ev = res.locals.ev;
	
	var attendee = res.locals.feedbackProfile;
	var profile;
	
	if (!attendee) {
		profile = new models.User({
			isFeedbackProfile: true,
			feedbackProfileEvent: res.locals.ev._id
		})
	} else {
		profile = attendee.user;
	}
	
	profile.email = req.body.email;
	profile.position = req.body.position;
	profile.company = req.body.company;
	profile.website = req.body.website;
	profile.desc = req.body.desc;
	profile.setName(req.body.name);
	
	if (req.files && req.files.avatar != null && req.files.avatar.name.length != 0) {
		var ext = req.files.avatar.type.split('/');
		var ext = ext[ext.length-1];
		profile.avatar = "/profileavatars/"+profile._id+"."+ext;
		
		fs.rename(req.files.avatar.path, config.path + "/public" + profile.avatar, function(err) {
			if (err) throw err;
			
			if (config.knox) {
				config.knox.putFile(config.path + "/public" + profile.avatar, "/public" + profile.avatar, function (err, res) {
					if (err) throw err;
					
					console.log("Uploaded FP Avatar to S3");
					res.resume()
				})
			}
			
			profile.createThumbnails(function() { })
		})
	}
	
	profile.save(function(err) {
		if (err) throw err;
	});
	
	if (!res.locals.feedbackProfile) {
		attendee = new models.Attendee({
			user: profile._id,
			category: req.body.category || "Attendee"
		})
		attendee.save(function (err) {
			if (err) throw err;
		})
		console.log(attendee._id)
		
		models.Event.findById(ev._id, function(err, event) {
			event.attendees.push(attendee._id)
			event.save()
		})
	} else {
		attendee.category = req.body.category || "Attendee";
		attendee.save()
	}
	
	res.format({
		html: function() {
			res.redirect('/event/'+res.locals.ev._id+'/admin/feedback')
		},
		json: function() {
			res.send({
				status: 200
			})
		}
	})
}

function sendnewsletter (req, res) {
	var eventid = req.params.id;
	var logged_in_user = req.user;
	var logged_in_user_id = req.user._id;
	var email = "haseebkhilji@gmail.com"
	console.log("hi newsletter");

	models.Event.findOne({"_id": mongoose.Types.ObjectId(eventid)}).populate("messages attendees users").exec(function(err, ev) {
		
		if(ev){
			var comments = ev.messages;
			var attendees = ev.attendees;
			var commentString = '';
			var commentHTML = '';
			if(comments.length > 0){
				//var commentString = '<div style="float:left; width:100%; margin-bottom:10px;" > <div style=" background:#E6E7E8; margin-left:10px; width:32%; float:left; padding:0px 10px 0px 0px;border-radius:110px; margin-bottom:10px; margin-right:10px;"> <div style="float:left; margin-right:15px;"><img src="http://demo.jamaltech.com/haseeb/newsletter/3.jpeg" width="100" height="100" style="border-radius:110px " /></div> <div style=" float:left ; margin:20px 0px 0px 20px"> <div class="font20a nspacer font-exception" style=" font-weight:bold">Haseeb</div> <div style="float:left; font-weight:bold"><div class="font20a nspacer font-exception" >Attendee</div></div> <div class="bold break font-change font-attendee font-exception"> Developer</div> </div> </div> <div style=" margin-top:10px;">'+thisComment+'</div> <div style=" margin-top:10px"><a href="#" style="color:#0992A3; font-weight:bold"><img src="http://demo.jamaltech.com/haseeb/newsletter/reply.png" style="padding-right:10px " width="40" align="left"/> <div style="margin:10px 0px 0px 0px; float:left">Reply</div></a></div> </div>';
				


				async.each(comments,
				  // 2nd param is the function that each item is passed to
				  function(item, callback){
				   	console.log(item);

				   	var thisComment = item.message;
					var attendee_id = item.attendee;
					models.Attendee.findOne({"_id": mongoose.Types.ObjectId(attendee_id)}).populate("user").exec(function (err, usr){
						

						console.log(usr.user.name+": "+thisComment);
						var username = usr.user.name;
						var user_category = usr.category;
						var replylink = '/replycomment';
						var profileImg = ((usr.user.avatar != '') ? 'http://localhost:3000'+usr.user.avatar : '');

						commentString = '<div style="float:left; width:100%; margin-bottom:10px;" > <div style=" background:#E6E7E8; margin-left:10px; width:32%; float:left; padding:0px 10px 0px 0px;border-radius:110px; margin-bottom:10px; margin-right:10px;"> <div style="float:left; margin-right:15px;"><img src="'+profileImg+'" width="100" height="100" style="border-radius:110px " /></div> <div style=" float:left ; margin:20px 0px 0px 20px"> <div class="font20a nspacer font-exception" style=" font-weight:bold">'+username+'</div> <div style="float:left; font-weight:bold"><div class="font20a nspacer font-exception" >'+user_category+'</div></div> <div class="bold break font-change font-attendee font-exception"> Developer</div> </div> </div> <div style=" margin-top:10px;">'+thisComment+'</div> <div style=" margin-top:10px"><a href="'+replylink+'" style="color:#0992A3; font-weight:bold"><img src="http://demo.jamaltech.com/haseeb/newsletter/reply.png" style="padding-right:10px " width="40" align="left"/> <div style="margin:10px 0px 0px 0px; float:left">Reply</div></a></div> </div>';
						commentHTML+= commentString;
						callback();
					});
				   	
				  },
				  // 3rd param is the function to call when everything's done
				  function(err){
				    // All tasks are done now
				    console.log("async done!");
				    //console.log(commentHTML);

				    var htmlcontent = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> <html xmlns="http://www.w3.org/1999/xhtml"> <head> <meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> <title>Untitled Document</title> </head> <body style="font-family:Arial, Helvetica, sans-serif"> <table width="700" border="0" cellspacing="0" cellpadding="0" bgcolor="#F7F7F7" align="center" style="padding:5px 0px"> <tr> <td> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td><img src="http://dev.eventmost.com/images/logo.svg" style="text-align:center ; margin:0px auto; display:block; margin-bottom:10px " /></td> </tr> <tr> <td> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td bgcolor="#0992A3" style="padding:10px 10px 10px 10px; font-size:22px; color:#FFFFFF">'+ev.name+'</td> </tr> <tr> <td style="padding:10px 10px 10px 10px; font-size:16px; color:#000"><p><img src="'+ev.avatar+'" style="padding:0px 15px 10px 0px; float:left" width="150" />'+ev.description+'</p></td> </tr> <tr> <td style="padding:10px 10px 10px 10px; font-size:20px; color:#FED298; text-align:center"><p>Dear Speaker, We have selected following questions for you to send a reply if you want.</p></td> </tr> <tr> <td> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td > '+commentHTML+'</td> </tr> </table> </td> </tr> </table> </td> </tr> <tr bgcolor="#542437"> <td style="color:#FFFFFF; padding:20px 10px;font-size:14px; text-align:center">Copyright &copy; 2015 <b>EventMost</b> | <a style=" color:#FFFFFF; text-decoration:none; " href="/contact">Contact us</a></td> </tr> </table> </td> </tr> </table> </body> </html>';

					var options = {
							from: "EventMost <noreply@eventmost.com>",
							to: " <"+email+">",
							subject: "Feedback Newsletter ",
							html: htmlcontent
						}


					config.transport.sendMail(options, function(err, response) {
							if (err) throw err;
							
							console.log("Email sent.."+response.message)
							res.format({
								json: function() {
									res.send({
										status: 200,
										//commentHTML: commentHTML,
										//event: ev,
										//attendees: attendees,
										//comments: comments,
										user: req.user._id
									})
								}
							})
						})



				  }
				);

				/*for(var i=0; i<comments.length; i++){
					//console.log(comments[i]);
					var thisComment = comments[i].message;
					var attendee_id = comments[i].attendee;
					models.Attendee.findOne({"_id": mongoose.Types.ObjectId(attendee_id)}).populate("user").exec(function (err, usr){
						

						//console.log(usr.user.name+": "+thisComment);
					});

					//console.log(thisComment);
					var replylink = '';
					var profileImg = '';

					commentString = '<div style="float:left; width:100%; margin-bottom:10px;" > <div style=" background:#E6E7E8; margin-left:10px; width:32%; float:left; padding:0px 10px 0px 0px;border-radius:110px; margin-bottom:10px; margin-right:10px;"> <div style="float:left; margin-right:15px;"><img src="http://demo.jamaltech.com/haseeb/newsletter/3.jpeg" width="100" height="100" style="border-radius:110px " /></div> <div style=" float:left ; margin:20px 0px 0px 20px"> <div class="font20a nspacer font-exception" style=" font-weight:bold">Haseeb</div> <div style="float:left; font-weight:bold"><div class="font20a nspacer font-exception" >Attendee</div></div> <div class="bold break font-change font-attendee font-exception"> Developer</div> </div> </div> <div style=" margin-top:10px;">'+thisComment+'</div> <div style=" margin-top:10px"><a href="#" style="color:#0992A3; font-weight:bold"><img src="http://demo.jamaltech.com/haseeb/newsletter/reply.png" style="padding-right:10px " width="40" align="left"/> <div style="margin:10px 0px 0px 0px; float:left">Reply</div></a></div> </div>';
					commentHTML+= commentString;
				}*/

				//console.log(commentHTML);

					
			}else{
				res.format({
					json: function() {
						res.send({
							status: 404,
							message: "No Comment Found!"
						})
					}
				})
			}
		}else{
			res.format({
					json: function() {
						res.send({
							status: 404,
							message: "No Event Found!",
							attendees: attendees,
							comments: comments,
							commentString: commentString,
							user: req.user._id
						})
					}
				})
		}
		
		

	});
	/*
	- Get all the comments from event by id
	- Make sure the logged in user is a planner of event.
	- Add comments to HTML
	- Send Newsletter.

	*/

	/*var email = "haseebkhilji@gmail.com";
	var htmlcontent = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> <html xmlns="http://www.w3.org/1999/xhtml"> <head> <meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> <title>Untitled Document</title> </head> <body style="font-family:Arial, Helvetica, sans-serif"> <table width="700" border="0" cellspacing="0" cellpadding="0" bgcolor="#F7F7F7" align="center" style="padding:5px 0px"> <tr> <td> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td><img src="http://dev.eventmost.com/images/logo.svg" style="text-align:center ; margin:0px auto; display:block; margin-bottom:10px " /></td> </tr> <tr> <td> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td bgcolor="#0992A3" style="padding:10px 10px 10px 10px; font-size:22px; color:#FFFFFF">SSCG Africa Annual Economic & Entrepreneurship Conference</td> </tr> <tr> <td style="padding:10px 10px 10px 10px; font-size:16px; color:#000"><p><img src="2.jpeg" style="padding:0px 15px 10px 0px; float:left" width="150" />Join us on 10 -11 June 2015 at The SSCG Africa Annual Economic & Entrepreneurship Conference, Oxford where more than 300 industry experts, business leaders, entrepreneurs, investors and officials will gather to explore how the business communities across Africa are meeting market challenges, creating growth opportunities and transforming their ec . . .</p></td> </tr> <tr> <td style="padding:10px 10px 10px 10px; font-size:20px; color:#FED298; text-align:center"><p>Dear Speaker, We have selected following questions for you to send a reply if you want.</p></td> </tr> <tr> <td> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td > <div style="float:left; width:100%; margin-bottom:10px;" > <div style=" background:#E6E7E8; margin-left:10px; width:32%; float:left; padding:0px 10px 0px 0px;border-radius:110px; margin-bottom:10px; margin-right:10px;"> <div style="float:left; margin-right:15px;"><img src="http://demo.jamaltech.com/haseeb/newsletter/3.jpeg" width="100" height="100" style="border-radius:110px " /></div> <div style=" float:left ; margin:20px 0px 0px 20px"> <div class="font20a nspacer font-exception" style=" font-weight:bold">Haseeb</div> <div style="float:left; font-weight:bold"><div class="font20a nspacer font-exception" >Attendee</div></div> <div class="bold break font-change font-attendee font-exception"> Developer</div> </div> </div> <div style=" margin-top:10px;">This is a test question for speaker?</div> <div style=" margin-top:10px"><a href="#" style="color:#0992A3; font-weight:bold"><img src="reply.png" style="padding-right:10px " width="40" align="left"/> <div style="margin:10px 0px 0px 0px; float:left">Reply</div></a></div> </div> <div style="float:left; width:100%; margin-bottom:10px;" > <div style=" background:#E6E7E8; margin-left:10px; width:32%; float:left; padding:0px 10px 0px 0px;border-radius:110px; margin-bottom:10px; margin-right:10px;"> <div style="float:left; margin-right:15px;"><img src="http://demo.jamaltech.com/haseeb/newsletter/1.jpeg" width="100" height="100" style="border-radius:110px " /></div> <div style=" float:left ; margin:20px 0px 0px 10px"> <div class="font20a nspacer font-exception" style=" font-weight:bold">m string</div> <div style="float:left; font-weight:bold"><div class="font20a nspacer font-exception" >Attendee</div></div> <div class="bold break font-change font-attendee font-exception"><br />Big Company</div> </div> </div> <div style=" margin-top:10px;">This is a another test question for speaker?</div> <div style=" margin-top:10px"><a href="#" style="color:#0992A3; font-weight:bold"><img src="reply.png" style="padding-right:10px " width="40" align="left"/> <div style="margin:10px 0px 0px 0px; float:left">Reply</div></a></div> </div> </td> </tr> </table> </td> </tr> </table> </td> </tr> <tr bgcolor="#542437"> <td style="color:#FFFFFF; padding:20px 10px;font-size:14px; text-align:center">Copyright &copy; 2015 <b>EventMost</b> | <a style=" color:#FFFFFF; text-decoration:none; " href="/contact">Contact us</a></td> </tr> </table> </td> </tr> </table> </body> </html>';

	var options = {
			from: "EventMost <noreply@eventmost.com>",
			to: " <"+email+">",
			subject: "Feedback Newsletter ",
			html: htmlcontent
		}


	config.transport.sendMail(options, function(err, response) {
			if (err) throw err;
			
			console.log("Email sent.."+response.message)
			res.format({
				json: function() {
					res.send({
						status: 200,
						message: "email sent"
					})
				}
			})
		})
	*/
}