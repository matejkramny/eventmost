var models = require('../models')
	mongoose = require('mongoose')

exports.router = function (app) {
	app.get('/cards', showCards)
		.get('/card/:id/view.json', getCard)
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
			res.json({ Card: card });
		} else {
			res.status(404);
			res.json({});
		}
	})
}

function doNewCard (req, res) {
	var cb = function (card) {
		card.edit(card, req.body, req.user, req.files, function(err) {
			if (err && err.length) {
				req.session.flash = err;
			}
			
			res.redirect('/cards');
		})
	}
	
	if (req.body.editId.length) {
		// Edit
		card = models.Card.findOne({ _id: mongoose.Types.ObjectId(req.body.editId) }, function(err, theCard) {
			if (err) throw err;
			
			if (theCard) {
				cb(theCard);
			} else {
				res.format({
					html: function() {
						res.status(404);
						res.send("")
					},
					json: function() {
						res.status(404);
						res.send({
							
						})
					}
				})
			}
		})
	} else {
		cb(new models.Card({}))
	}
}

function doEditCard (req, res) {
	
}