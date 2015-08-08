var models = require('../../../../models')
var config = require('../../../../config')
	, stripe = config.stripe
	, bugsnag = require('bugsnag')
	, transport = config.transport
	, mongoose = require('mongoose')
	, async = require('async')
	, util = require('../../util')

exports.router = function (app) {
	attending = require('./apievent').attending
	
	app.get('/api/event/:id/attendees', listAttendeesAPI)
		.get('/api/event/:id/attendee/:attendee', showAttendeeAPI)
		.post('/api/event/:id/attendee/:attendee/register', util.authorized, getAttendeeAPI)
		//.post('/api/event/:id/attendee/:attendee/register', getAttendeeAPI, registerAttendeeAPI)
		.post('/api/event/:id/attendee/:attendee/unregister', getAttendeeAPI, unregisterAttendeeAPI)
		.post('/api/event/:id/attendee/:attendee/remove', removeAttendeeAPI)
		.post('/api/event/:id/join', joinEventAPI)
		.post('/api/event/:id/buy/tickets', getTransactionsAPI)
		.get('/api/event/:id/buy/tickets/getPromotionalCode/:code', getPromotionalCode)
		.post('/api/event/getattendeeid', getattendeeid)
		.post('/api/event/makeadmin/:attendee', makeAdmin)
		.post('/api/event/removeadmin/:attendee', removeAdmin)
		.post('/api/event/:id/removeban/:uid', removeBan)
}

function getattendeeid(req, res){
	var eventid = req.body.id;
	var userid = req.body.userid;
	var resp = {
		status: 404,
		message: "Attendee not found!"
	};

	if(eventid == null || userid == null){
		res.format({
			json: function() {
				res.send({
					status: 401,
					message: "Invalid Arguments"
				})
			}
		});
	}else{
		var query = {"_id" : eventid};	

		models.Event.find(query)
		.populate('attendees')
		.select('attendees')
		.lean()
		.exec(function(err, ev) {
			if(ev.length > 0){
				var allattendees = ev[0].attendees;
				allattendees.forEach(function(att) {
					if(att.user == userid){
						resp = {
							status: 200,
							attendee_id: att._id
						};
					}
				});

				res.format({
					json: function() {
						res.send(resp);
					}
				});
			}else{
				res.format({
					json: function() {
						res.send({
							status: 402,
							message: "Event not found!"
						})
					}
				});
			}
		});
	}
}

function listAttendeesAPI (req, res) {
	// Found the Event currently requested by user.
	models.Event.findOne({_id:req.params.id} , function(err, event) 
	{
		// Fetch Messages By One By One.
		if(event){
			var query = {'_id': {$in: event.attendees}, 'isAttending': true};
		
			models.Attendee.find(query)
			.populate({path: 'user'})
			.populate("user", "name email")
			.select('user registered isAttending ticket checkedOff admin')
			.sort('-created')
			.limit(10)
			.exec(function(err, messages) {
				if(messages.length > 0){
					res.format({
							json: function() {
								res.send({
									status: 200,
									users: messages
								})
							}
						});
				}else{
					res.format({
							json: function() {
								res.send({
									status: 402,
									message: "No Attendee Found!"
								})
							}
						});
				}
			})
		}else{
			res.format({
						json: function() {
							res.send({
								status: 404,
								message: "No Event Found!"
							})
						}
					});
		}
		
	});
}

function getAttendeeAPI (req, res, next) 
{
	console.log("Get Attendee API -----".red);
	console.log("Res.Locals.EventAdmin ".red + res.locals.eventadmin);
}

function registerAttendeeAPI (req, res) {
	
	console.log("Register Attendee API".red );
	
	res.locals.requestedAttendee.checkedOff = true;
	res.locals.requestedAttendee.save();
	
	res.format({
		json: function() {
			res.send({
				status: 200
			})
		}
	});
}

function unregisterAttendeeAPI (req, res) {
	res.locals.requestedAttendee.checkedOff = false;
	res.locals.requestedAttendee.save();
	
	res.format({
		json: function() {
			res.send({
				status: 200
			})
		}
	});
}

function showAttendeeAPI (req, res) {
	console.log("Show Attendee API".red);
	
	// Found the Event currently requested by user.
	models.Event.findOne({_id:req.params.id} , function(err, event) 
	{
		// Fetch Messages By One By One.
		var query = {'_id': req.params.attendee};
		
		models.Attendee.find(query)
		.populate({path: 'user'})
		.select('user registered isAttending ticket checkedOff')
		.sort('-created')
		.limit(10)
		.exec(function(err, messages) {
			
			
			var options = {
				path: 'attendee.user',
				model: 'User'
			};
			
			models.Attendee.populate(messages , options , function(err , usermessages)
			{
			res.format({
					json: function() {
						res.send({
							status: 200,
							events: usermessages
						})
					}
				});
			}
		);
	})
	});
}

function removeAttendeeAPI (req, res) {
	
	var event_id = req.params.id;
	var attendee_id = req.params.attendee;
	var current_user = req.body._id;
	var banned = req.body.ban == undefined ? false : req.body.ban;
	
	console.log(req.params);
	console.log(req.body);
	
	// Find if current_user is event admin or not.
	models.Event.findOne({_id : event_id})
	.populate(
		{
			path:'attendees',
			match: { user: current_user }
		}
	)
	.exec(function(err, event) 
	{
		if(err){
			json: function() {
					res.send({
						status: 404,
						message: err

					});
				}
			});
			return;
		}

		if(!event){
			json: function() {
					res.send({
						status: 404,
						message: "Event is not found"

					});
				}
			});	
			return;
		}

		if(event.attendees[0].admin || event.attendees[0]._id == attendee_id)
		{

			models.Attendee.findOne({_id : attendee_id})
			.exec(function(err, Attendee)
			{
				console.log("in attende function");
				Attendee.isAttending= false;
				Attendee.save();

				if(banned){
					models.Event.findById(event_id, function (err, ev) {
						if(ev.banned == undefined){
							ev.banned = [];
						}
						console.log(Attendee.user)
						var i = ev.banned.indexOf(Attendee.user);
						console.log(i)
						if(i == -1){
							models.Event.findByIdAndUpdate(event_id, {$push: {banned: Attendee.user}}, 
						        function(ex) {
						            if (ex)
						            {
						                console.log("Exception : " + ex);
						            }
						        }
							);

							// ev.banned.push(Attendee.user);
							// ev.save()
							console.log("user banned")
						}
					});
				}

				res.format({
				json: function() {
					res.send({
						status: 200,
						message:"Event Attendee Removed"

					});
					}
				});

			});

		}

		else
		{
			console.log("only admin can do this action");
			res.format({
				json: function() {
					res.send({
						status: 404,
						message:"only admin can do this action",

					});
					}
				});
		}
	});
}

function joinEventAPI (req, res) {
	console.log(req.body);
	console.log(" Join Event API ".red);
	
	var Event_ID = req.params.id;
	var User_ID =  req.body._id;
	var cat = req.body.cat;

    if (!User_ID) {
        res.send({
            status: 412,
            message: "UserID(_id) is missing"

        })
        return;
    }

	// Get the Event.
	// Found the Event currently requested by user.
	models.Event.findOne({_id:Event_ID} , function(err, event) 
	{

		if (event.banned && event.banned.length > 0) {
			for (var i = 0; i <= event.banned.length; i++) {
				if (event.banned[i] == User_ID) {
					res.send({
						status: 412,
						message: "UserID is banned from event"
					})
					return;
				}
			}
		}

		var query = {'_id': {$in: event.attendees} , 'user' : User_ID};
		
		// Suppose it will always return one object if application.
		// Should never have two record against same user
		models.Attendee.findOne(query)
		.exec(function(err, existing_attendee) 
		{

			if(existing_attendee) // You are already attending
			{
				// Check if its isAttending is false;
				// Make it true again.
				if(!existing_attendee.isAttending)
				{
					existing_attendee.isAttending =  true;
                    existing_attendee.category = cat;
					existing_attendee.save();
				}

				//If only category changes
				if(!existing_attendee.category != cat)
				{
					existing_attendee.category = cat;
					existing_attendee.save();
				}
				
				res.format({
				json: function() {
					res.send({
						status: 200
					});
					}
				});
			}
			else // New Attendee
			{
				var attendee = new models.Attendee({
					user: User_ID
					});
					
					attendee.category = cat;
					attendee.save();
					
					// add to event
					event.attendees.push(attendee._id);
					event.save();
					
					
					res.format({
					json: function() {
						res.send({
						status: 200
						});
						}
					});
				
			}
			
			
		});
		
	});

	return;
}

function payWithCardAPI (req, res) {
	
	var token = req.body.payment_id;
	var ev = res.locals.ev;
	
}

exports.addAttendee = addAttendee = function (ev, user, force) {
	if (typeof force === 'undefined') {
		force = false;
	}

	var attendee = new models.Attendee({
		category: "",
		hasPaid: true,
		isAttending: force,
		user: user
	});
	
	models.Event.findById(ev._id, function(err, event) {
		event.attendees.push(attendee._id);
		event.save();
	});
	
	attendee.save();
}

exports.isReallyAttending = isReallyAttending = function (ev, user, cb) {
	models.Event.findById(ev._id).select('attendees').populate('attendees').exec(function(err, event) {
		if (err || !event) {
			return cb(err);
		}
		
		var really = null;
		
		for (var i = 0; i < event.attendees.length; i++) {
			var attendee = event.attendees[i];
			if (attendee.user.equals(user._id)) {
				really = attendee;
				
				break;
			}
		}
		
		cb(null, really);
	});
}

function emailConfirmation (req, res, transaction) {
	var link = "/event/"+res.locals.ev._id;
	var user = req.user;
	
	var rows = "";
	
	//TODO move this to jade..
	var promo = null;
	for (var i = 0; i < transaction.tickets.length; i++) {
		var ticket = transaction.tickets[i];
		if (typeof ticket.promo !== "undefined" && ticket.promo && ticket.promo.code && ticket.promo.code.length > 0) {
			promo = {
				promo: ticket.promo,
				ticket: ticket
			};
		}
		
		rows += "<tr>";
		rows += "<td>"+ticket.name+"</td>";
		rows += "<td style='text-align:right;'><strong>"+ticket.quantity+"</strong></td>";
		rows += "<td style='text-align:right;'>Â£"+(ticket.price + ticket.fees).toFixed(2)+"</td>";
		rows += "</tr>";
	}
	
	rows += "<tr>";
	rows += "<td>&nbsp;</td>";
	rows += "<td>&nbsp;</td>";
	rows += "<td>&nbsp;</td>";
	rows += "</tr>";
	
	var subtotal = transaction.total - transaction.third_party;
	if (promo) {
		var discount = promo.ticket.price * (promo.promo.discount / 100);
		subtotal += discount;
	}
	
	rows += "<tr>";
	rows += "<td>Subtotal</td>";
	rows += "<td></td>";
	rows += "<td style='text-align:right;'>Â£"+subtotal.toFixed(2)+"</td>";
	rows += "</tr>";
	
	if (promo) {
		rows += "<tr>";
		rows += "<td>Discount Code ("+promo.promo.code+")</td>";
		rows += "<td></td>";
		var discount = promo.ticket.price * (promo.promo.discount / 100);
		rows += "<td style='text-align:right;'>-Â£"+discount.toFixed(2)+"</td>";
		rows += "</tr>";
	}
	
	rows += "<tr>";
	rows += "<td>Transaction Fee</td>";
	rows += "<td></td>";
	rows += "<td style='text-align:right;'>Â£"+transaction.third_party.toFixed(2)+"</td>";
	rows += "</tr>";
	
	rows += "<tr>";
	rows += "<td>Total Paid</td>";
	rows += "<td></td>";
	rows += "<td style='text-align:right;'>Â£"+transaction.total.toFixed(2)+"</td>";
	rows += "</tr>";
	rows += "<tr>";
	rows += "</tr>";
	
	// TODO move this to the User model
	var options = {
		from: "EventMost <notifications@eventmost.com>",
		to: user.getName()+" <"+user.email+">",
		subject: "Ticket Payment Confirmation",
		html: "<img src=\"http://eventmost.com/images/logo.svg\">\
<br/><br/><p><strong>Hi "+user.getName()+",</strong><br/><br/>This is an email confirmation of tickets you purchased through EventMost for Event <a href='https://"+req.host+link+"'>"+res.locals.ev.name+"</a>.<br/><br/>\
<table>\
<thead>\
<tr>\
	<th style='min-width: 100px;'>Ticket Name</th>\
	<th style='min-width: 50px;'>Quantity</th>\
	<th style=''>Price</th>\
</tr>\
</thead>\
<tbody>\
"+rows+"\
</tbody>\
</table>\
<br />\
<br/>\
Please do not reply to this email, because we are super popular and probably won't have time to read it..."
	}
	if (!config.transport_enabled) {
		console.log("Transport not enabled!")
		console.log(options);
		return;
	}
	
	transport.sendMail(options, function(err, response) {
		if (err) throw err;
	
		console.log("Email sent.."+response.message)
	})

	// Record that an email was sent
	var emailNotification = new models.EmailNotification({
		to: user._id,
		email: user.email,
		type: "PaymentConfirmation"
	})
	emailNotification.save(function(err) {
		if (err) throw err;
	});
}

function getTransactionsAPI (req, res) {
	
	console.log("Get Transactions".red);
	// Only one Ticket _ PS19 later to be changed
	var __tickets;
	
	var token = req.body.payment_id;
	var ev = res.locals.ev;
	
	var query = {'_id': req.body.ticket_id};
	models.Ticket.find(query)
	.exec(function(err, event_tickets) {
		
		__tickets = event_tickets;
	
		var transactions = [];
		
		var transaction = new models.Transaction({
			event: req.params.id,
			user: req.body._id,
			total: 0,
			profit: 0,
			planner: 0,
			third_party: 0
		});
		
		models.Event.findOne({_id:req.params.id} , function(err, ev) 
		{
			var ts = [];
			var promo = lookupPromoCode(ev, req.body.promotionalCode);
			
			
			models.Ticket.find({'_id': {$in: ev.tickets}} , function(err, these_tickets)
			{ 
				for (var i = 0; i < these_tickets.length; i++) {
					var ticket = these_tickets[i];
					for (var t = 0; t < __tickets.length; t++) {
						_id = __tickets[t].id;
						try {
							_id = mongoose.Types.ObjectId(_id);
						} catch (e) {
							continue;
						}
						
						if (ticket._id.equals(_id) && __tickets[t].quantity > 0) {
							var sold_or_expired = false;
							var now = new Date();
							if (ticket.hasSaleDates && !(now.getTime() > ticket.start.getTime() && now.getTime() < ticket.end.getTime())) {
								sold_or_expired = true;
							}
							if (ticket.quantity <= 0) {
								sold_or_expired = true;
							}
							if (__tickets[t].quantity > ticket.quantity) {
								sold_or_expired = true;
							}
							var min = ticket.min_per_order;
							if (min < 0) min = 0;
							var max = ticket.max_per_order;
							if (max < 0) max = 0;
							
							if (min != 0 && min > __tickets[t].quantity) {
								sold_or_expired = true;
							}
							if (max != 0 && __tickets[t].quantity > max) {
								sold_or_expired = true;
							}
							
							if (sold_or_expired) {
								
								// valid date range..
								transaction.status = 'failed';
								transaction.message = "You tried to purchase tickets which are either sold out or are expired. Please reload the page and try again.";
								
								return {
									tickets: ts,
									transaction: transaction
								};
							}
							
							ts.push({
								ticket: ticket,
								quantity: __tickets[t].quantity
							});
							
							var name = ticket.name;
							
							var em_fee = ticket.price * 0.024 + 0.2;
							if (ticket.price == 0) {
								em_fee = 0;
							}
							
							var promoForThisTicket = null;
							if (promo && promo.ticket._id.equals(ticket._id)) {
								promoForThisTicket = {
									code: promo.discount.code,
									discount: promo.discount.discount
								};
							}
							
							var quantity = __tickets[t].quantity;
							transaction.tickets.push({
								price: ticket.price,
								fees: em_fee,
								quantity: quantity,
								ticket: ticket._id,
								name: name,
								promo: promoForThisTicket
							});
							
							
							
							
							if (promoForThisTicket) {
								var discount = ticket.price * (promoForThisTicket.discount / 100);
								var newPrice = ticket.price - discount;
								var __em_fee = newPrice * 0.024 + 0.2;
								if (newPrice == 0) {
									__em_fee = 0;
								}
								
								quantity -= 1;
								
								transaction.profit += __em_fee;
								transaction.planner += newPrice;
								transaction.total += newPrice + __em_fee;
							}
							
							transaction.profit += em_fee * quantity;
							transaction.planner += ticket.price * quantity;
							
							var ticketPrice = ticket.price + em_fee;
							var ticketTotal = ticketPrice * quantity;
							transaction.total += ticketTotal;
						}
					}
				}
				
				
				if (transaction.status == 'failed') {
					res.send({
						status: 400,
						message: transaction.message
					});
					return;
				}
				
				
				var total = transaction.total;
				if (total == 0) {
					// Free tickets
					transaction.third_party = 0;
					
					transaction.status = 'complete';
					transaction.save();
					
					for (var i = 0; i < ts.length; i++) {
						ts[i].ticket.quantity -= ts[i].quantity;
						if (ts[i].ticket.quantity < 0) ts[i].ticket.quantity = 0;
						ts[i].ticket.save();
					}
					
					addAttendee(ev, req.body._id);
					
					//emailConfirmation(req, res, transaction);
					
					
					
					res.send({
						status: 200
					});
					
					return;
				}
				
				 if (!token) {
					  res.send({
						  status: 400
					  });
					  return;
				 }
 	
				//'Reverse the fees'
				total = (total + 0.2) / (1 - 0.025);
				
				transaction.third_party = total - transaction.total;
				transaction.total = total;
	
				stripe.charges.create({
					amount: Math.round(total * 100), //must be in pennies
					currency: "gbp",
					card: token,
					description: "EventMost Tickets",
					metadata: {
						transaction: transaction._id
					}}, function(err, charge) {
						if (err) {
							console.log(err);
							transaction.status = 'failed';
							transaction.message = err.toString();
							transaction.save();
							
							var message = "";
							switch (err.type) {
								case 'StripeCardError':
									// A declined card error
									message = err.message; // => e.g. "Your card's expiration year is invalid."
									break;
								case 'StripeInvalidRequestError':
								case 'StripeAPIError':
								case 'StripeConnectionError':
								case 'StripeAuthenticationError':
								default:
									message = "Server Error. We have been notified, and are working on it. Please try again later.";
									bugsnag.notify(new Error("Card Processing Error: "+err.type), {
										error: err,
										transaction: transaction._id,
										user: req.body._id
									});
							}
							
							res.send({
								status: 400,
								message: message
							});
							
							return;
						}
						
						console.log(charge);
						
						console.log("Transaction Complete".red);
						transaction.status = 'complete';
						transaction.save();
		
						var ts = meta.tickets;
						for (var i = 0; i < ts.length; i++) {
							ts[i].ticket.quantity -= ts[i].quantity;
							if (ts[i].ticket.quantity < 0) ts[i].ticket.quantity = 0;
							ts[i].ticket.save();
						}
						
						addAttendee(ev, req.body._id);
						
						//emailConfirmation(req, res, transaction);
						
						res.send({
							status: 200
						});
					});
			});
		});
	});
}

function lookupPromoCode (ev, code) {
	if (typeof code !== "string" || code.length == 0) {
		return null;
	}
	
	code = code.toLowerCase();
	
	var found = false;
	var tickets = [];// tickets promo applies to
	
	for (var i = 0; i < ev.tickets.length; i++) {
		var promCodes = ev.tickets[i].discountCodes;
		if (promCodes && promCodes.length > 0) {
			for (var x = 0; x < promCodes.length; x++) {
				if (code == promCodes[x].code.toLowerCase()) {
					if ((found == false || promCodes[x].discount >= found.discount) && ev.tickets[i].quantity > 0) {
						found = promCodes[x];
						tickets.push(ev.tickets[i]);
						break;
					}
				}
			}
		}
	}
	
	var ticket = null;
	for (var i = 0; i < tickets.length; i++) {
		if (ticket == null || tickets[i].price > ticket.price) {
			ticket = tickets[i];
		}
	}
	
	if (found) {
		return {
			discount: found,
			ticket: ticket
		}
	}
	
	return null;
}

function getPromotionalCode (req, res) {
	var ev = res.locals.ev;
	var code = req.params.code;
	
	var result = lookupPromoCode(ev, code);
	
	if (result == null) {
		res.send({
			status: 404
		})
	} else {
		res.send({
			status: 200,
			discount: result.discount.discount,
			ticket: result.ticket._id
		})
	}
}

function makeAdmin(req,res){
	try{
		query = {"_id": req.params.attendee}

		models.Attendee.findOneAndUpdate(query, { $set: { admin: true }}, {upsert:true},function(err, message){
			if(err) return res.send(500, {error: err})
			return res.send({ status: 200} )
		});
	}catch (err){
		console.log(err);
	}
}

function removeAdmin(req,res){
	try{
		query = {"_id": req.params.attendee}

		models.Attendee.findOneAndUpdate(query, { $set: { admin: false }}, {upsert:true},function(err, message){
			if(err) return res.send(500, {error: err})
			return res.send({ status: 200})
		});
	}catch (err){
		console.log(err);
	}
}

function removeBan(req,res){

	console.log("Removing ban of " + req.params.uid);
	models.Event.findById(req.params.id).exec(function(err, ev){
		if(ev){

			if(ev.banned){

				var i = ev.banned.indexOf(req.params.uid);
				if(i != -1){
					ev.banned.splice(i,1);
					ev.save();
					res.send(200, {status: 200, message: "User un-banned"})
				} else {
					res.send(200, {status: 200, message: "User doesnt exist"})
				}
			} else{
				res.send(200,{status: 200, message: "no banned members found"})
			}
		} else{
			res.send(404, {status: 200, message: "Event doesnt exist"})
		}

	})
}