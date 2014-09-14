var models = require('../models'),
	mongoose = require('mongoose'),
	inbox = require('./inbox/index'),
	config = require('../config'),
	fs = require('fs'),
	util = require('../util'),
	gm = require('gm').subClass({ imageMagick: true });

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
		.post('/cards/upload', util.authorized, uploadCardImage)
}

function uploadCard(req, res){
	res.render('profile/uploadcard', { title: "Upload Card" });
}

function uploadCardImage(req, res){
	
	var x = req.body.x;
	var y = req.body.y;
	var w = req.body.w;
	var h = req.body.h;
	var path = req.files.card.path;
	var userId = req.session.passport.user;
	
	/*var ext = path.split('.');
	ext = ext[ext.length-1];*/


	var card = new models.Card({
		user : userId
	});

	card.save(function(err, doc){
		cardId = doc._id;
		var writeURL = '/businesscards/'+cardId+'.png';
	
		gm(path)
			.options({imageMagick: true})
			.crop(w, h, x, y)
			.write(config.path + "/public" + writeURL, function(err){
			if (err) throw err;
		});

		res.send('sucesss');

	});
}

function showCards (req, res) {
	models.Card.find({ user: req.user._id }, { _id: 1, primary: 1 }).sort('-created').exec(function(err, cards) {
		res.locals.cards = cards;
		
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
				user.save()
			}
			
			req.session.flash = ["Business Card Sent"]
			res.redirect('/user/'+to);
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
