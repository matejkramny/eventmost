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
		.post('/api/cards/deleteBusinessCard', deleteBusinessCard)
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
						status: 200,
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
	var businessCard;
	var base64Image;
	var dir = 'public/businesscards';
	var i = 0;
	if(req.body._id == ""){
		res.format({
			json: function() {
				res.send({
					status: 404,
					message: "Mandatory parameter _id(user id) required."
				})
			}
		})
	} else {
		models.User.findById(req.body._id, function(err, user) {
			if(user != null){
				if (!fs.existsSync(dir)){
					fs.mkdirSync(dir);
				}
				//businessCard = req.body.businessCard;
				console.log("upload card: " + req.files.uploadCard.path);
				//base64Image = businessCard.replace(/^data:image\/png;base64,/, "");
				console.log("userId: " + req.body._id);
				models.Card.find({user:req.body._id}).count(function(err,count){
					i = count+1;

					var newcard = new models.Card({
						user: req.body._id,
						location: req.body._location,
						url : 'public/businesscards/'+req.body._id + "+" + i +'.png',
						created: Date.now(),
						primary: false
					})
					console.log("business count: " + i);
					newcard.save(function(err,card) {
						fs.readFile(req.files.uploadCard.path, function (err, data) {
							fs.writeFile('public/businesscards/'+req.body._id + "+" + i +'.png', data, function(err){
								if (err) throw err
								console.log('Business card  saved.')
							})
						});

						res.format({
							json: function() {
								res.send({
									status: 200,
									_id:card._id,
									message: "Business card added."
								})
							}
						})
						return;
					});
				})
			} else {
				res.format({
					json: function() {
						res.send({
							status: 404,
							message: "_id(User Id) not found."
						})
					}
				})
			}
		})

	}
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
			user.save(function(err) {
				res.format({
					json: function() {
						res.send({
							status: 200,
							message: "Business card send."
						})
					}
				})
				return;
			})
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

		if (card != null) {

			models.Card.update({ user: req.body._id }, { $set: { primary: false }}, { multi: true }, function(err) {
				if (err) throw err;

				models.Card.update({ _id: id }, { $set: { primary: true }}, function(err) {
					res.format({
						json: function() {
							res.send({
								status: 200,
								message: "Business card updated."
							})
						}
					})
					return;
				});
			});
		} else {
			res.format({
				json: function() {
					res.send({
						status: 404,
						message: "No user id or card id found."
					})
				}
			})
			return;
		}
	})
}

function getCardsSharedWithMeAPI(req, res)
{
	var jsonCardArray = [];
	var jsonCardObject = {};
	var jsonFromObject = {};
	var jsonMainObject = {};
	models.User.findOne({_id:req.body._id})
		.populate('receivedCards.card receivedCards.from')
		.select('receivedCards.card receivedCards.from' )
		.exec(function(err, current_user)
		{
			for(var i=0;i<current_user.receivedCards.length;i++){
				var obj = current_user.receivedCards[i];
				console.log(current_user.receivedCards[i]);
				for (var key in obj) {
					if (obj.hasOwnProperty(key)) {
						if(key == "from"){
							jsonFromObject["_id"] = obj[key]._id;
							jsonFromObject["email"] = obj[key].email;
							jsonFromObject["avatar"] = obj[key].avatar;
							jsonFromObject["name"] = obj[key].name;
							jsonFromObject["surname"] = obj[key].surname;
							jsonMainObject["from"] = jsonFromObject;
							jsonCardArray.push(jsonMainObject);
							jsonFromObject = {};
						}
						if(key == "card"){
							jsonCardObject["_id"] = obj[key]._id;
							jsonCardObject["user"] = obj[key].user;
							jsonCardObject["primary"] = obj[key].primary;
							jsonMainObject["card"] = jsonCardObject;
							jsonCardObject = {};
						}

					}

				}
				jsonMainObject = {};
			}
			//console.log(jsonCardArray);
			res.format({
				json: function() {
					res.send({
						status: 200,
						cards: jsonCardArray
					})
				}
			})
		});
}

function deleteBusinessCard(req,res){
	res.set('Content-Type', 'application/json');
	var businessCard = req.body._id;

	models.Card.findOne({ _id: businessCard}, function(err, card) {
		if (err) throw err;
		if(card != null){
			models.User.find({receivedCards:{$elemMatch:{card:businessCard}}},function(err,result){
				result.forEach(function(resultLoop){
					models.User.collection.update(
						{ _id: resultLoop._id },
						{ $pull: { receivedCards: { card: new mongoose.Types.ObjectId(businessCard) } } }
					);
				});
				models.Card.remove({_id:businessCard},function(err,deletedCard){
					res.format({
						json: function() {
							res.send({
								status: 200,
								message: "Business card deleted."
							})
						}
					})
				});
			})
		} else {
			res.format({
				json: function() {
					res.send({
						status: 404,
						messages: "No Business Card Found!"
					})
				}
			})
		}
	});
}