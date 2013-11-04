models = require('../../models')

exports.listEvents = function (req, res) {
	models.Event.find({ deleted: false })
		.populate('avatar attendees.user')
		.sort('-start')
		.exec(function(err, evs) {
		// TODO limit mount of events received
		if (err) throw err;
		if (evs) {
			res.format({
				html: function() {
					res.render('event/list', { events: evs, pagename: "Events", title: "Events" });
				},
				json: function() {
					res.send({
						events: evs,
						pagename: "Events"
					})
				}
			});
		}
	})
}

exports.listMyEvents = function (req, res) {
	models.Event.find({ 'attendees.user': req.user._id })
		.populate('avatar attendees.user')
		.sort('-start')
		.exec(function(err, evs) {
		if (err) throw err;
		if (evs) {
			res.format({
				html: function() {
					res.render('event/list', { events: evs, pagename: "My events", title: "My Events" });
				},
				json: function() {
					res.send({
						events: evs,
						pagename: "My events"
					})
				}
			})
		}
	})
}

exports.listNearEvents = function (req, res) {
	var lat = parseFloat(req.query.lat)
		,lng = parseFloat(req.query.lng)
		,limit = parseInt(req.query.limit)
		,distance = req.query.distance
	
	if (!lat || !lng) {
		// render a blank page, and tell it to ask user for browser positioning
		res.format({
			html: function() {
				res.render('event/list', { events: [], findNear: true, pagename: "Events near you", title: "Events nearby" });
			},
			json: function() {
				res.send({
					events: [],
					pagename: "Events near you"
					// no lat&lng supplied!
				})
			}
		})
		return;
	}
	
	if (limit == NaN) {
		limit = 10;
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
		}).populate('event event.avatar')
		.limit(limit)
		.exec(function(err, geos) {
			if (err) throw err;
		
			if (geos) {
				var events = [];
				
				for (var i = 0; i < geos.length; i++) {
					if (geos[i].event == null) {
						continue;
					}
					if (geos[i].event.deleted != true) {
						geos[i].event.geo = geos[i].geo;
						events.push(geos[i].event);
					}
				}
				
				res.format({
					html: function() {
						res.render('event/list', { events: events, pagename: "Events near you", title: "Events nearby" })
					},
					json: function() {
						res.send({
							events: events,
							pagename: "Events near you"
						})
					}
				})
			}
		}
	);
}

exports.listSpeakers = function (req, res) {
	
}

exports.listAttendees = function (req, res) {
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
		},
		json: function() {
			res.send({
				event: res.locals.ev,
				attending: res.locals.eventattending
			})
		}
	});
}