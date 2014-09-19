var fs = require('fs')
	, models = require('../../../../models')
	, mongoose = require('mongoose')
	, util = require('../../util')
	, async = require('async')
	, transport = require('../../../../app').transport

exports.router = function (app) {
	app.post('/api/cards', showCardsAPI)
		//.all('/api/card/*', util.authorized)
		//.get('/api/card/new', newCardAPI)
		//.get('/api/card/:id', getCardAPI)
		.post('/api/card/new', doNewCardAPI)
		.post('/api/cards/send', sendCardAPI)
		//.get('/api/cards/choosePrimary', choosePrimary)
		.post('/api/cards/choosePrimary/:id', doChoosePrimaryAPI)
		.post('/api/cards/sharedwithme', getCardsSharedWithMeAPI)
		.get('/api/addsharedcard', addcardsapi)
}


 function addcardsapi(req, res)
 {
	 models.User.findById("540d914cefe0aaa4148a042c", function(err, ev) {
				 ev.savedProfiles.push(mongoose.Types.ObjectId('54044fb5b0704280069b6790'));
				 ev.save()
			 });
 }

function showCardsAPI (req, res) {
	
	console.log("Shows Cards ".red);
	console.log(req.body);
	
	//console.log(req.user._id);
	
	var query = { 'user': req.body._id};
		
	models.Card.find(query)
	.populate('user')
	.exec(function(err, usercards) {
					res.format({
						json: function() {
							res.send({
								cards: usercards
							})
						}
					})
				});

}

function newCardAPI (req, res) {
	console.log("Create New Card ".red);

			
			
}

function getCardAPI (req, res) {
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

function doNewCardAPI (req, res) {
	console.log("do New Card".red);
	
	console.log(req.body);

	var newcard = new models.Card({
				user: req.body._id,
				location: req.body._location,
				created: Date.now(),
				primary: false
			})
	
	newcard.save(function(err) {
			res.format({
				json: function() {
					res.send({
						status: 200
					})
				}
			})
			return;
				});
}

function sendCardAPI (req, res) {
	
	var to = req.body._to || null;
	var id = req.body._id || null;
	var card_id = req.body._cardID;
	
	console.log("------ Send Card API -------".red);
	console.log(req.body);
	
		// Send the card
		models.User.findById(to, function(err, user) {
			if (err) throw err;
			
			if (user) {
				//if (user.notification.email.businessCards) {
				//	inbox.emailNotification(user, "inbox")
				//}
				//user.mailboxUnread++;
				
				// find the card
				user.receivedCards.push({
					from: req.body._id,
					card: card_id
				})
				user.save()
			}
		});
}

function doEditCard (req, res) {
	
}

function choosePrimary (req, res) {
	models.Card.find({ user: req.user._id }, { _id: 1, primary: 1 }).sort('-created').exec(function(err, cards) {
		res.locals.cards = cards;
		
		res.render('profile/choosePrimaryCard', { title: "Business cards" });
	});
}

function doChoosePrimaryAPI (req, res) {
	var id = req.params.id;
	console.log("do Choose Primary API");
	console.log("card id ".red + id);
	console.log(req.body);
	
	
	models.Card.findOne({ _id: id, user: req.body._id }, function(err, card) {
		if (err) throw err;
		
		if (card) {
			
			models.Card.update({ user: req.body._id }, { $set: { primary: false }}, { multi: true }, function(err) {
				if (err) throw err;
				
				models.Card.update({ _id: id }, { $set: { primary: true }}, function(err) {
					
					return;
				});
			});
		} else {
			
			return;
		}
	})
}

function getCardsSharedWithMeAPI(req, res)
{
	models.User.findOne({_id:req.body._id})
	.populate('receivedCards.card receivedCards.from')
	.select('receivedCards.card receivedCards.from' )
	.exec(function(err, current_user) 
	{
		res.format({
		json: function() {
				res.send({
					cards: current_user.receivedCards
						})
					}
				})
		});
}
