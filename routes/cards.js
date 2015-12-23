var models = require('../models'),
	mongoose = require('mongoose'),
	inbox = require('./inbox/index'),
	config = require('../config'),
	fs = require('fs'),
	util = require('../util'),
	async = require('async'),
	gm = require('gm');

exports.router = function (app) {
	app.get('/cards', util.authorized, showCards)
		.all('/card/*', util.authorized)
		.get('/card/new', newCard)
		.get('/card/:id', getCard)
		.post('/card/new', doNewCard)
		.get('/cards/send', util.authorized, sendCard)
		.get('/cards/choosePrimary', choosePrimary)
		.get('/cards/choosePrimary/:id', doChoosePrimary)
		.get('/cards/upload', uploadCard)
		.post('/cards/upload', uploadCardImage)
		.get('/cards/remove/:id', remove)
}

function uploadCard(req, res){
	res.render('profile/uploadcard', { title: "Upload Card" });
}

function remove(req, res){
	var id = req.params.id;

	models.Card.findOne({ _id: id }, function(err, card) {
		if (card) {
			if(String(req.user._id) == String(card.user)){
				
				fs.unlink(config.path + "/public/businesscards/" + card._id + ".png");
				card.remove();
				req.session.message = "Card Deleted Successfully!";
				res.redirect('/cards');
			}else{
				req.session.message = "You are not authorized!";
				res.redirect('/cards');
			}
		} else {
			req.session.message = "Card Not Found!";
			res.redirect('/cards');
		}
	})

	

}

function uploadCardImage(req, res){
	
	var x = req.body.x;
	var y = req.body.y;
	var w = req.body.w;
	var h = req.body.h;
	var path = req.files.card.path;
	var userId = req.session.passport.user;
	
	console.log(x+path+userId);
	/*var ext = path.split('.');
	ext = ext[ext.length-1];*/


	var card = new models.Card({
		user : userId
	});

	card.save(function(err, doc){
		cardId = doc._id;
		var writeURL = '/businesscards/'+cardId+'.png';
	
		gm(path).crop(w, h, x, y).write(config.path + "/public" + writeURL, function(err){
			console.log("writing new image");
			//if (err) throw err;
		});

		req.session.message = 'Your business card has been saved';
		res.send('sucesss');

	});
}

function showCards (req, res) {
	models.Card.find({ user: req.user._id }, { _id: 1, primary: 1 }).sort('-created').exec(function(err, cards) {
		res.locals.cards = cards;
		if(req.session.message){
			res.locals.message = req.session.message;
			req.session.message = null;
		}

		
		res.render('profile/cards', { title: "Business cards" });
	});
}

function newCard (req, res) {
	res.render('profile/cardtool', { title: "Business cards" });
}

function getCard (req, res) {
	var id = req.params.id;
	
	try {
		id = mongoose.Types.ObjectId(id);
	} catch (e) {
		res.redirect('back');
		return;
	}
	
	models.Card.findOne({ _id: id }, function(err, card) {
		if (err) throw err;
		
		if (card) {
			res.status(200);
			fs.readFile(config.path+"/data/cardhtml/"+card._id+".html", function(err, html) {
				if (err) throw err;
				
				res.end(html)
			});
		} else {
			res.status(404);
			res.json({});
		}
	})
}

function doNewCard (req, res) {
	new models.Card({
		user: req.user._id
	}).edit(req.files.html, function(err) {
		if (err && err.length) {
			req.session.flash = err;
		}
		
		res.format({
			html: function() {
				res.redirect('/cards');
			},
			json: function() {
				res.send({
					status: 200
				})
			}
		})
	})
}

function sendCard (req, res) {
	var to = req.query.to || null;
	var id = req.query.id || null;
	
	if (id) {
		try {
			id = mongoose.Types.ObjectId(id);
		} catch (e) {
			res.redirect('back');
			return;
		}
	}
	
	try {
		to = mongoose.Types.ObjectId(to);
	} catch (e) {
		res.redirect('/')
		return;
	}

	

	
	if (to && id) {
		// Send the card
		models.User.findById(to, function(err, user) {
			if (err) throw err;
			
			if (user) {
				if (user.notification.email.businessCards) {
					inbox.emailNotification(user, "inbox")
				}
				user.mailboxUnread++;
				
				// find the card
				user.receivedCards.push({
					from: req.user._id,
					card: id
				})
				user.save();


			}

						
			async.series([
				
				function (callback){
					if(user.isFeedbackProfile == true){

						

						var cardImg = 'http://eventmost.com/businesscards/'+id+'.png';
						var commentHTML = '';
						var feedbackEventId = user.feedbackProfileEvent;
						
						var email = user.email;
						var username = req.user.name;
						var user_id = req.user._id;
						var user_category = '';
						var user_position = req.user.position;
						//var replylink = 'http://eventmost.com/reply-feedback-message/'+msg._id+'/'+req.user._id+'/'+user._id;
						var profileImg = ((req.user.avatar != '') ? 'http://eventmost.com'+req.user.avatar : 'http://eventmost.com/images/default_speaker-purple.png');


						//commentString = '<div style="float:left; width:100%; margin-bottom:10px;" > <div style=" background:#E6E7E8; margin-left:10px; width:32%; float:left; padding:0px 10px 0px 0px;border-radius:110px; margin-bottom:10px; margin-right:10px;"> <div><div style="width:90px; height:90px !important; float:left"><img src="'+profileImg+'" width="90px" height="90px" style="border-radius:110px; max-width:100% !important; min-height: auto !important; display: block !important;" alt="'+username+'" title="'+username+'" /></div></div> <div style=" float:left ; margin:20px 0px 0px 20px"> <div class="font20a nspacer font-exception" style=" font-weight:bold">'+username+'</div> <div style="float:left; font-weight:bold"><div class="font20a nspacer font-exception" >'+user_category+'</div></div> <div class="bold break font-change font-attendee font-exception"> '+user_position+'</div> </div> </div> <div style=" margin-top:10px;">'+thisComment+'</div> <div style=" margin-top:10px"><a href="'+replylink+'" style="color:#0992A3; font-weight:bold"><img src="http://eventmost.com/images/reply.png" style="padding-right:10px " width="40" align="left"/> <div style="margin:10px 0px 0px 0px; float:left">Reply</div></a></div> </div>';
						commentString = '<tr> <td><table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td><table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td width="52%"><div style=" margin-left:10px; padding:0px 10px 0px 0px;border-radius:90px; margin-bottom:10px; margin-right:10px;"> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td width="40%" align="center" style="border-right: 1px solid #E6E7E8" ><img src="'+profileImg+'" height="90" max-width="100%" /></td> <td valign="middle" width="60%" background="" align="left" ><div style="background: #e6e7e8 0 0; border-radius: 0 90px 90px 0; float: left; margin: 0 0 0 20px; padding: 20px 10px; width: 78%;"> <div class="bold font-exception" style=" font-size:14px; font-weight:bold">'+username+'</div> <div style="float:left;"> <div class=" font-exception" >'+user_category+'</div> </div> <div class=" break font-change font-attendee font-exception" style="float:left; clear:both; font-size:14px"> '+user_position+' </div> </div></td> </tr> </table> </div></td> <td width="48%" ><img src="'+cardImg+'" style="max-height:200px; width:100%"></td> </tr> </table></td> </tr> </table></td> </tr>'
						commentHTML+= commentString;

						models.Event.findOne({"_id": mongoose.Types.ObjectId(feedbackEventId)}).populate("avatar").exec(function(err, ev) {
							console.log(ev);
							var eventAvatar = String(ev.avatar.url);
						    eventAvatar = ((eventAvatar.indexOf("http") > -1) ? eventAvatar : 'http://eventmost.com'+eventAvatar);
						    

						    
							
							var htmlcontent = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> <html xmlns="http://www.w3.org/1999/xhtml"> <head> <meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> <title>newsletter</title> <link href="http://eventmost.com/css/bootstrap-eventmost.css" rel="stylesheet" type="text/css" /> </head> <body style="font-family:Arial, Helvetica, sans-serif"> <table width="700" border="0" cellspacing="0" cellpadding="0" bgcolor="#F7F7F7" align="center" style="padding:5px 0px"> <tr> <td><table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td><img src="http://eventmost.com/images/logo.png" style="text-align:center ; margin:0px auto; display:block; margin-bottom:10px " width="280px" height="58px" /></td> </tr> <tr> <td><table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td bgcolor="#0992A3" style="padding:10px 10px 10px 10px; font-size:22px; color:#FFFFFF">'+ev.name+'</td> </tr> <tr> <td style="padding:10px 10px 10px 10px; font-size:16px; color:#000"><p><img src="'+eventAvatar+'" style="padding:0px 15px 10px 0px; float:left" width="150" />'+ev.description+'</p></td> </tr> <tr> <td style="padding:10px 10px 10px 10px; font-size:20px; color:#FED298; text-align:center"><p>Dear Speaker, Following attendee has sent you business card.</p></td> </tr> '+commentHTML+' </table></td> </tr> <tr bgcolor="#542437"> <td style="color:#FFFFFF; padding:20px 10px;font-size:14px; text-align:center">Copyright &copy; 2015 <b>EventMost</b> | <a style=" color:#FFFFFF; text-decoration:none; " href="/contact">Contact us</a></td> </tr> </table></td> </tr> </table> </body> </html>';
							var options = {
									from: "EventMost <noreply@eventmost.com>",
									to: " <"+email+">",
									subject: "Business Card From EventMost",
									html: htmlcontent
								}



							config.transport.sendMail(options, function(err, response) {
								if (err) throw err;
								
								callback();
							});
						});
					}else{
						callback();
					}
				}

				], 
				function (err){
					req.session.flash = ["Business Card Sent"]
					res.redirect('/user/'+to);
				}
			);
		});
	} else {
		models.Card.find({ user: req.user._id }, { _id: 1 }).sort('-created').exec(function(err, cards) {
			if (err) throw err;
			res.render('profile/sendCard', { cards: cards, title: "Send business card", sendTo: to });
		})
	}
}

function doEditCard (req, res) {
	
}

function choosePrimary (req, res) {
	models.Card.find({ user: req.user._id }, { _id: 1, primary: 1 }).sort('-created').exec(function(err, cards) {
		res.locals.cards = cards;
		
		res.render('profile/choosePrimaryCard', { title: "Business cards" });
	});
}

function doChoosePrimary (req, res) {
	var id = req.params.id;
	
	try {
		id = mongoose.Types.ObjectId(id);
	} catch (e) {
		res.redirect('back');
		return;
	}
	
	models.Card.findOne({ _id: id, user: req.user._id }, function(err, card) {
		if (err) throw err;
		
		if (card) {
			models.Card.update({ user: req.user._id }, { $set: { primary: false }}, { multi: true }, function(err) {
				if (err) throw err;
				
				models.Card.update({ _id: id }, { $set: { primary: true }}, function(err) {
					req.session.flash.push("Primary Card Changed");
					res.redirect('/cards');
					return;
				});
			});
		} else {
			res.redirect('back');
			return;
		}
	})
}
