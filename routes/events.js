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
		.get('/events', listEvents)
		.get('/events/my', listMyEvents)
		.get('/events/near', listNearEvents)
}

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
		description: req.body.description,
		password: {
			enabled: password_enabled,
			password: password_enabled ? req.body.password : ""
		},
		location: {
			lat: req.body.lat,
			lng: req.body.lng,
			address: req.body.address
		}
	});
	
	if (req.files.avatar != null) {
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
	
	
	models.Event
		.findOne({ deleted: false, _id: mongoose.Types.ObjectId(id) })
		.populate('user')
		.exec(function(err, ev) {
			if (err) throw err;
			
			if (ev.user) {
				if (ev.user._id.equals(req.user._id)) {
					// owns the event, no need to search if the user is attending
					draw(ev, true);
					return;
				}
			}
			models.Attendee
				.findOne({
					event: ev._id,
					user: req.user._id
				}, function(err, attendee) {
					if (err) throw err;
					
					if (attendee) {
						// is attending.
						draw(ev, true);
					} else {
						draw(ev, false);
					}
				});
		}
	)
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
		.exec(
			function(err, ev) {
				if (err) throw err;
				
				if (ev) {
					res.render('event/edit', { event: ev });
				} else {
					res.redirect('/')
				}
			}
		)
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
		
		ev.location.lat = req.body.lat;
		ev.location.lng = req.body.lng;
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
	
	// TODO check lat & lng

	models.Event.find(
		{ deleted: false,
			'location': {
				$near: {
					$geometry: {
						type: "Point",
						coordinates: [lng, lat]
					},
					$maxDistance: 0.09009009009
				}
			}
		},
		function(err, evs) {
			if (err) throw err;
			
			if (evs) {
				res.render('event/list', { events: evs, pagename: "Events near you" })
			}
		}
	);
}

exports.joinEvent = joinEvent = function (req, res) {
	var id = req.params.id
		,password = req.body.password;
	
	var joinEvent = function (ev) {
		var attendee = new models.Attendee({
			event: ev._id,
			user: req.user._id
		}).save();
	}
	
	models.Event
		.findOne({
			deleted: false,
			_id: mongoose.Types.ObjectId(id)
		}, function(err, ev) {
			if (err) throw err;
			
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
