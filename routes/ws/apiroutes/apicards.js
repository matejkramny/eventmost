var models = require('../../../models'),
	mongoose = require('mongoose'),
	inbox = require('./apiinbox/apiindex'),
	config = require('../../../config'),
	fs = require('fs'),
	util = require('../../../util')

// exports.router = function (app) {
	// app.get('/cards', util.authorized, showCards)
		// .all('/api/card/*', util.authorized)
		// .get('/api/card/new', newCard)
		// .get('/api/card/:id', getCard)
		// .post('/api/card/new', doNewCard)
		// .get('/api/cards/send', util.authorized, sendCard)
		// .get('/api/cards/choosePrimary', choosePrimary)
		// .get('/api/cards/choosePrimary/:id', doChoosePrimary)
// }

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
