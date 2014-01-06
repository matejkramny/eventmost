var models = require('../models'),
	mongoose = require('mongoose'),
	inbox = require('./inbox/index'),
	config = require('../config'),
	fs = require('fs'),
	util = require('../util')

exports.router = function (app) {
	app.get('/cards', util.authorized, showCards)
		.all('/card/*', util.authorized)
		.get('/card/new', newCard)
		.get('/card/:id', getCard)
		.post('/card/new', doNewCard)
		.get('/cards/send', util.authorized, sendCard)
}

function showCards (req, res) {
	models.Card.find({ user: req.user._id }, { _id: 1 }).sort('-created').exec(function(err, cards) {
		res.locals.cards = cards;
		
		res.render('profile/cards', { title: "Business cards" });
	});
}

function newCard (req, res) {
	res.render('profile/cardtool', { title: "Business cards" });
}

function getCard (req, res) {
	var id = req.params.id;
	
	models.Card.findOne({ _id: mongoose.Types.ObjectId(id) }, function(err, card) {
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
	}
	
	models.Card.find({ user: req.user._id }, { _id: 1 }).sort('-created').exec(function(err, cards) {
		if (err) throw err;
		res.render('profile/sendCard', { cards: cards, title: "Send business card", sendTo: to });
	})
}

function doEditCard (req, res) {
	
}