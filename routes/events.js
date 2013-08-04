var models = require('../models')
	,mongoose = require('mongoose')
	,fs = require('fs')

exports.router = function (app) {
	app.get('/event/add', addEvent)
		.post('/event/add', doAddEvent)
		.get('/event/:id', viewEvent)
		.get('/event/:id/edit', editEvent)
		.post('/event/:id/edit', doEditEvent)
		.get('/event/:id/delete', deleteEvent)
		.post('/event/:id/join', joinEvent)
		.get('/event/:id/attendees', listAttendees)
		.get('/event/:id/speakers', listSpeakers)
		.get('/events', listEvents)
		.get('/events/my', listMyEvents)
		.get('/events/near', listNearEvents)
}

// TODO add methods to Event model, getEvent, listEvents etc.. some stuff is repeating in the methods below.

exports.addEvent = addEvent = function (req, res) {
	res.render('event/add')
}

exports.doAddEvent = doAddEvent = function (req, res) {
	if (req.body.name == null || req.body.name.length == 0) {
		req.session.flash = ["Event name is missing"]; // TODO flash messages
		res.redirect('/event/add');
		return;
	}
	
	var password_enabled = req.body.password_protected != null ? true : false;
	var newEvent = new models.Event({
		deleted: false,
		name: req.body.name,
		created: Date().now,
		start: Date.parse(req.body.date_start),
		end: Date.parse(req.body.date_end),
		user: req.user._id,
		description: req.body.desc,
		password: {
			enabled: password_enabled,
			password: password_enabled ? req.body.password : ""
		},
		location: {
			address: req.body.address
		}
	});
	
	var lat = parseFloat(req.body.lat),
		lng = parseFloat(req.body.lng);
	if (!isNaN(lat) && !isNaN(lng)) {
		// good lat/lng
		var geo = new models.Geolocation({
			geo: {
				lat: lat,
				lng: lng
			},
			event: newEvent._id
		}).save();
	}
	
	if (req.files.avatar != null && req.files.avatar.name.length != 0) {
		var ext = req.files.avatar.type.split('/');
		var ext = ext[ext.length-1];
		newEvent.avatar = "/avatars/"+newEvent._id+"."+ext;
		fs.readFile(req.files.avatar.path, function(err, avatar) {
			fs.writeFile(__dirname + "/../public"+newEvent.avatar, avatar, function(err) {
				if (err) throw err;
				
				newEvent.save(function(err) {
					if (err) throw err;
					res.redirect('/event/'+newEvent._id);
				})
			});
		});
		return;
	} else {
		newEvent.avatar = "/img/event.png";
	}
	
	newEvent.save(function(err) {
		res.redirect('/event/'+newEvent._id);
	})
}

exports.viewEvent = viewEvent = function (req, res) {
	var id = req.params.id;
	if (!id) {
		res.redirect('/events');
	}
	
	var draw = function (ev, attending) {
		if (ev) {
			res.render('event/view', { event: ev, attending: attending });
		} else {
			res.status(404)
			res.send("Not found")
		}
	}
	
	models.Event.getEvent(id, function(ev) {
		if (!ev) {
			req.session.flash.push("Event not found");
			res.redirect('/');
			return;
		}
		console.log(ev);
		
		var attending = false;
		if (ev.user && ev.user._id.equals(req.user._id)) {
			// owns the event, no need to search if the user is attending
			attending = true;
		} else {
			for (var i = 0; i < ev.attendees.length; i++) {
				if (ev.attendees[i]._id.equals(req.user._id)) {
					attending = true;
					break;
				}
			}
		}
		
		draw(ev, attending);
	});
}

exports.editEvent = editEvent = function (req, res) {
	var id = req.params.id;
	
	models.Event
		.findOne(
			{
				deleted: false,
				_id: mongoose.Types.ObjectId(id)
			})
		.populate('user')
		.exec(function(err, ev) {
			if (err) throw err;
			
			if (ev) {
				models.Geolocation.findOne({ event: ev._id }, function(err, geo) {
					ev.geo = geo;
					res.render('event/edit', { event: ev });
				})
			} else {
				res.redirect('/')
			}
		})
}

exports.doEditEvent = doEditEvent = function (req, res) {
	var errors = [];
	
	models.Event.findOne({ _id: mongoose.Types.ObjectId(req.params.id), deleted: false }, function(err, ev) {
		if (err) throw err;
		
		if (!ev) {
			req.session.flash.push("Event not found!");
			res.redirect('/');
			return;
		}
		
		ev.name = req.body.name;
		ev.start = Date.parse(req.body.start);
		ev.end = Date.parse(req.body.end);
		ev.description = req.body.desc;
		
		var lat = parseFloat(req.body.lat);
		var lng = parseFloat(req.body.lng);
		
		// if found existing event location, edit it. otherwise create new
		models.Geolocation.findOne({ event: mongoose.Types.ObjectId(ev._id) }, function(err, geo) {
			if (err) throw err;
			
			if (!geo) {
				geo = new models.Geolocation({});
			}
			
			if (!isNaN(lat) && !isNaN(lng)) {
				geo.geo.lat = lat;
				geo.geo.lng = lng;
				geo.event = ev._id;
				
				geo.save();
			} else {
				geo.remove();
			}
		});
		
		ev.location.address = req.body.address;
		
		ev.password.enabled = req.body.password_protected ? true : false;
		ev.password.password = ev.password.enabled ? req.body.password : "";
		
		ev.settings.allowAttToGuest = req.body.allowAtt2Guest ? true : false;
		ev.settings.allowAttToAtt = req.body.allowAtt2Att ? true : false;
		ev.settings.upload = req.body.upload ? true : false;
		
		if (req.files.avatar != null && req.files.avatar.name.length != 0) {
			var ext = req.files.avatar.type.split('/');
			var ext = ext[ext.length-1];
			
			ev.avatar = "/avatars/"+ev._id+"."+ext;
			
			fs.readFile(req.files.avatar.path, function(err, avatar) {
				fs.writeFile(__dirname + "/../public"+ev.avatar, avatar, function(err) {
					if (err) throw err;
					
					ev.save(function(err) {
						if (err) throw err;
						
						req.session.flash.push("Event avatar updated")
						req.session.flash.push("Event settings updated");
						res.redirect('/event/'+ev._id+'/edit');
					})
				});
			});
			return;
		} else {
			ev.save(function(err) {
				if (err) throw err;
				
				req.session.flash.push("Event settings updated");
				res.redirect('/event/'+ev._id+"/edit");
			})
		}
	})
}


exports.deleteEvent = deleteEvent = function (req, res) {
	models.Event.findOne({ _id: mongoose.Types.ObjectId(req.params.id), deleted: false }, function(err, ev) {
		if (err) throw err;
		
		if (ev) {
			ev.deleted = true;
			ev.save(function(err) {
				if (err) throw err;
			});
			req.session.flash.push("Event deleted");
			res.redirect('/events/my')
		} else {
			res.redirect('/');
		}
	})
}

exports.listEvents = listEvents = function (req, res) {
	models.Event.find({ deleted: false }, function(err, evs) {
		// TODO limit mount of events received
		if (err) throw err;
		if (evs) {
			res.render('event/list', { events: evs, pagename: "Events" });
		}
	})
}

exports.listMyEvents = listMyEvents = function (req, res) {
	models.Event.find({ user: req.user._id, deleted: false }, function(err, evs) {
		if (err) throw err;
		if (evs) {
			res.render('event/list', { events: evs, pagename: "My events" });
		}
	})
}

exports.listNearEvents = listNearEvents = function (req, res) {
	var lat = parseFloat(req.query.lat)
		,lng = parseFloat(req.query.lng)
		,limit = req.query.limit
		,distance = req.query.distance
	
	if (!lat || !lng) {
		// render a blank page, and tell it to ask user for browser positioning
		res.render('event/list', { events: [], pagename: "Events near you" });
		return;
	}
	
	models.Geolocation.find(
		{ 'geo': {
				$near: {
					$geometry: {
						type: "Point",
						coordinates: [lng, lat]
					},
					$maxDistance: 0.09009009009
				}
			}
		}).populate('event')
		.exec(function(err, geos) {
			if (err) throw err;
		
			if (geos) {
				var events = [];
				for (var i = 0; i < geos.length; i++) {
					if (geos[i].event.deleted != true) {
						geos[i].event.geo = geos[i].geo;
						events.push(geos[i].event);
					}
				}
				res.render('event/list', { events: events, pagename: "Events near you" })
			}
		}
	);
}

exports.joinEvent = joinEvent = function (req, res) {
	var id = req.params.id
		,password = req.body.password;
	
	var joinEvent = function (ev) {
		ev.attendees.push(req.user._id);
		ev.save();
	}
	
	models.Event.getEvent(id, function(ev) {
		if (ev) {
			if (ev.password.enabled) {
				if (ev.password.password == password) {
					// join event.
					joinEvent(ev);
				} else {
					// display flash stating they got the password wrong.
					req.session.flash.push("Event password incorrect.")
				}
			} else {
				// join event.
				joinEvent(ev);
			}
			
			res.redirect('/event/'+ev._id);
		} else {
			// TODO 404
		}
	})
}

exports.listSpeakers = listSpeakers = function (req, res) {
	
}

exports.listAttendees = listAttendees = function (req, res) {
	
}
