var models = require('../models')
	mongoose = require('mongoose')

exports.router = function (app) {
	app.get('/cards', showCards)
		.get('/card/:id', getCard)
		.post('/card/new', doNewCard)
}

function showCards (req, res) {
	models.Card.find({ user: req.user._id }, function(err, cards) {
		res.render('profile/cards', { cards: cards, title: "Business cards" });
	});
}

function getCard (req, res) {
	var id = req.params.id;
	
	models.Card.findOne({ _id: mongoose.Types.ObjectId(id) }, function(err, card) {
		if (err) throw err;
		
		if (card) {
			res.status(200);
			res.end(card.html);
		} else {
			res.status(404);
			res.json({});
		}
	})
}

function doNewCard (req, res) {
	new models.Card({}).edit(req.body.html, function(err) {
		if (err && err.length) {
			req.session.flash = err;
		}
		
		res.redirect('/cards');
	})
}

function doEditCard (req, res) {
	
}