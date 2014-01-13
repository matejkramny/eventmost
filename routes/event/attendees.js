var models = require('../../models')

exports.router = function (app) {
	attending = require('./event').attending
	
	app.get('/event/:id/attendees', listAttendees)
		.get('/event/:id/attendee/:attendee', showAttendee)
		.get('/event/:id/attendee/:attendee/remove', removeAttendee)
		.post('/event/:id/join', joinEvent)
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