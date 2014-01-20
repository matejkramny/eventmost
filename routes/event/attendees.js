var models = require('../../models')
var config = require('../../config')
var paypal_sdk = require('paypal-rest-sdk')
	, stripe = config.stripe

exports.router = function (app) {
	attending = require('./event').attending
	
	app.get('/event/:id/attendees', listAttendees)
		.get('/event/:id/attendee/:attendee', showAttendee)
		.get('/event/:id/attendee/:attendee/remove', removeAttendee)
		.post('/event/:id/join', joinEvent)
		.post('/event/:id/buy/tickets/paypal', payWithPaypal)
		.post('/event/:id/buy/tickets/card', payWithCard)
		.get('/event/:id/buy/tickets/paypal/cancel', cancelPaypalTransaction)
		.get('/event/:id/buy/tickets/paypal/return', completePaypalTransaction)
}

function listAttendees (req, res) {
	if (!res.locals.eventattending) {
		res.format({
			html: function() {
				res.redirect('/event/'+res.locals.ev._id);
			},
			json: function() {
				res.send({
					status: 403,
					message: "Not attending"
				})
			}
		})
		
		return;
	}
	
	res.format({
		html: function() {
			res.render('event/attendees', { title: "Attendees at "+res.locals.ev.name })
		}/*,
		json: function() {
			res.send({
				event: res.locals.ev,
				attending: res.locals.eventattending
			})
		}*/
	});
}

function showAttendee (req, res) {
	var attID = req.params.attendee;
	var ev = res.locals.ev;
	
	try {
		attID = mongoose.Types.ObjectId(attID)
	} catch (e) {
		res.redirect('/event/'+ev._id)
		return;
	}
	
	var found = false;
	var theAttendee;
	for (var i = 0; i < ev.attendees.length; i++) {
		var attendee = ev.attendees[i];
		
		if (typeof attendee.user === "object" && attendee._id.equals(attID)) {
			found = true;
			theAttendee = attendee;
			break;
		}
	}
	
	if (!found) {
		res.redirect('/event/'+ev._id)
		return;
	}
	
	res.locals.theUser = theAttendee.user;
	res.locals.theAttendee = theAttendee;
	res.locals.saved = false;
	res.render('user', { title: theAttendee.user.getName() });
}

function removeAttendee (req, res) {
	if (res.locals.eventadmin !== true) {
		res.format({
			html: function() {
				res.redirect('/event/'+res.locals.ev._id);
			},
			json: function() {
				res.send({
					status: 404
				})
			}
		});
		return;
	}
	
	var attID = req.params.attendee;
	var ev = res.locals.ev;
	
	try {
		attID = mongoose.Types.ObjectId(attID)
	} catch (e) {
		res.redirect('/event/'+ev._id)
		return;
	}
	
	for (var i = 0; i < ev.attendees.length; i++) {
		var attendee = ev.attendees[i];
		
		if (typeof attendee.user === "object" && attendee._id.equals(attID)) {
			if (attendee.admin) {
				break;
			}
			
			attendee.isAttending = false;
			attendee.save();
			break;
		}
	}
	
	res.redirect('/event/'+ev._id);
}

function joinEvent (req, res) {
	var password = req.body.password;
	var category = req.body.category;
	
	var ev = res.locals.ev;
	
	if (res.locals.eventattending) {
		res.format({
			html: function() {
				res.redirect('/event/'+ev._id);
			},
			json: function() {
				res.send({
					status: 400,
					message: "Already attending"
				})
			}
		})
		return;
	}
	
	if (ev.accessRequirements.password) {
		if (ev.accessRequirements.passwordString != password) {
			// display flash stating they got the password wrong.
			res.format({
				html: function() {
					req.session.flash.push("Event password incorrect.")
					res.redirect('/event/'+ev._id);
				},
				json: function() {
					res.send({
						status: 400,
						message: "Event password incorrect"
					})
				}
			});
			return;
		}
	}
	
	models.Event.findById(ev._id).select('attendees').populate({
		path: 'attendees',
		match: { isAttending: false }
	}).exec(function(err, event) {
		if (err || !event) {
			console.log("Something foul is happening here :(");
			// reject
			res.format({
				html: function() {
					req.session.flash.push("Server Error")
					res.redirect('/event/'+ev._id);
				},
				json: function() {
					res.send({
						status: 500,
						mesage: "Server Error."
					})
				}
			});
			
			return;
		}
		
		for (var i = 0; i < event.attendees.length; i++) {
			if (event.attendees[i].user.equals(req.user._id)) {
				event.attendees[i].isAttending = true;
				event.attendees[i].save();
				res.format({
					html: function() {
						res.redirect('/event/'+ev._id);
					},
					json: function() {
						res.send({
							status: 200
						})
					}
				})
				return;
			}
		}
		
		var attendee = new models.Attendee({
			user: req.user._id
		});
	
		if (category && category.length > 0) {
			// Check if category exists & is valid
			var foundCategory = false;
			for (var i = 0; i < ev.categories.length; i++) {
				if (category == ev.categories[i]) {
					// Good
					foundCategory = true;
					break;
				}
			}
		
			if (foundCategory || ev.allowAttendeesToCreateCategories == true) {
				attendee.category = category;
			} else {
				// reject
				res.format({
					html: function() {
						req.session.flash.push("An Invalid category selected.")
						res.redirect('/event/'+ev._id);
					},
					json: function() {
						res.send({
							status: 400,
							mesage: "An Invalid category selected."
						})
					}
				})
				return;
			}
		}
	
		if (!attendee.category) {
			attendee.category = "Attendee";
		}
	
		attendee.save()
		ev.attendees.push(attendee._id);
		ev.save(function(err) {
			if (err) throw err;
		});
	
		req.session.flash = ["Yay! You're now attending "+ev.name+"!"]
	
		res.format({
			html: function() {
				res.redirect('/event/'+ev._id);
			},
			json: function() {
				res.send({
					status: 200
				})
			}
		})
	})
}

function payWithCard (req, res) {
	var token = req.body.payment_id;
	
	var transaction = getTransactions(req, res);
	var total = transaction.total;
	//'Reverse the fees'
	total = (total + 0.2) / (1 - 0.025);
	transaction.third_party = total - transaction.total;
	transaction.total = total;
	transaction.method = 'stripe';
	
	var charge = stripe.charges.create({
		amount: Math.round(total * 100), //must be in pennies
		currency: "gbp",
		card: token,
		description: "payinguser@example.com"
	}, function(err, charge) {
		if (err) {
			console.log(err);
			
			transaction.status = 'failed';
			transaction.message = err.toString();
			transaction.save();
			
			res.send({
				status: 400,
				message: ""
			});
			
			return;
		}
		
		console.log(charge);
		
		transaction.status = 'complete';
		transaction.save();
		
		res.send({
			status: 200
		})
	})
}

function getTransactions (req, res) {
	var __tickets = req.body.tickets;
	var transactions = [];
	
	var transaction = new models.Transaction({
		event: res.locals.ev._id,
		user: req.user._id
	})
	
	for (var i = 0; i < res.locals.ev.tickets.length; i++) {
		var ticket = res.locals.ev.tickets[i];
		for (var t = 0; t < __tickets.length; t++) {
			_id = __tickets[t].id;
			try {
				_id = mongoose.Types.ObjectId(_id);
			} catch (e) {
				continue;
			}
			
			if (ticket._id.equals(_id) && __tickets[t].quantity > 0) {
				if (__tickets[t].quantity > ticket.quantity) {
					__tickets[t].quantity = ticket.quantity;
				}
				
				var name = ticket.type;
				if (name == 'custom') name = ticket.customType;
				
				var em_fee = ticket.price * 0.024 + 0.2;
				
				transaction.tickets.push({
					price: ticket.price,
					fees: em_fee,
					quantity: __tickets[t].quantity,
					ticket: ticket._id,
					name: name
				})
				
				transaction.profit += em_fee;
				transaction.planner += ticket.price;
				
				var ticketPrice = ticket.price + em_fee;
				var ticketTotal = ticketPrice * __tickets[t].quantity;
				transaction.total += ticketTotal;
			}
		}
	}
	
	return transaction;
}

function payWithPaypal (req, res) {
	var port = "";
	if (!config.production && config.mode == "") {
		//port = ":"+config.port;
		//TODO email paypal that using this causes HTTP 500 on their end.
	}
	var url = req.protocol + port + "://" + req.host + "/event/"+res.locals.ev._id+"/buy/tickets/paypal/";
	
	var transaction = getTransactions(req, res);;
	
	total = transaction.total;
	//'Reverse the transaction fees'
	total = (total + 0.2) / (1 - 0.035);
	// Round it up
	total = Math.round(total * 100) / 100;
	
	transaction.third_party = total - transaction.total;
	transaction.total = total;
	transaction.method = 'paypal';
	
	var transactions = [
		{
			amount: {
				total: total.toFixed(2),
				currency: "GBP"
			},
			description: "EventMost Tickets"
		}
	];
	
	var payment = {
		intent: "sale",
		payer: { payment_method: "paypal" },
		redirect_urls: {
			return_url: url+"return",
			cancel_url: url+"cancel"
		},
		transactions: transactions
	};
	
	transaction.save();
	req.session.ticketPayment = transaction._id;
	
	paypal_sdk.payment.create(payment, function (err, payment) {
		if (err) {
			if (err.httpStatusCode = 500) {
				// Tell User Paypal screwed up
				res.send({
					status: 500,
					message: "Sorry, PayPal is unresponsive at the moment. Please try again later."
				})
			} else {
				// Tell user we screwed up
				res.send({
					status: 500,
					message: "Sorry, PayPal Payments are unavailable at this moment. Please try again later."
				})
			}
			
			transaction.status = 'failed';
			transaction.message = err.toString();
			transaction.save();
			
			// TODO Log this exception.
			return;
		}
		
		console.log(payment);
		transaction.payment_id = payment.id;
		transaction.save();
		
		var redirectUrl;
		for (var i = 0; i < payment.links.length; i++) {
			var link = payment.links[i];
			if (link.method === 'REDIRECT') {
				redirectUrl = link.href;
			}
		}
		
		if (!redirectUrl) {
			// Error
			res.send({
				status: 500,
				message: "Sorry, PayPal Payments are unavailable at this moment. Please try again later."
			})
			return;
		}
		
		res.send({
			status: 200,
			redirect: redirectUrl
		});
	})
}

function cancelPaypalTransaction (req, res) {
	var ticketPayment = req.session.ticketPayment;
	req.session.ticketPayment = null;
	
	models.Transaction.findById(ticketPayment, function(err, transaction) {
		if (err) throw err;
		
		transaction.status = 'cancelled';
		transaction.save();
	});
	
	res.redirect('/event/'+res.locals.ev._id);
}

function completePaypalTransaction (req, res) {
	var ticketPayment = req.session.ticketPayment;
	req.session.ticketPayment = null;
	
	models.Transaction.findById(ticketPayment, function(err, transaction) {
		var payerId = req.query.PayerID;
		var details = { "payer_id": payerId };
		
		console.log(ticketPayment);
		console.log(transaction);
		
		console.log(req.query)
		
		paypal_sdk.payment.execute(transaction.payment_id, details, function (err, payment) {
			if (err) throw err;
			
			console.log(payment)
			transaction.status = 'complete';
			transaction.save();
			
			res.redirect('/event/'+ticketPayment.event);
		})
	})
}