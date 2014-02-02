var models = require('../../models')
	, util = require('../../util')
	, async = require('async')
	, moment = require('moment')

exports.router = function (app) {
	app.get('/events', exports.listEvents)
		.get('/events/my', util.authorized, exports.listMyEvents)
		.get('/events/near', exports.listNearEvents)
}

exports.listEvents = function (req, res) {
	models.Event.find({ deleted: false, privateEvent: { $ne: true } })
		.populate('avatar attendees.user')
		.select('name start end address venue_name avatar')
		.sort('-created')
		.exec(function(err, evs) {
		// TODO limit mount of events received
		if (err) throw err;
		if (evs) {
			res.format({
				html: function() {
					res.locals.moment = moment;
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

// TODO fix this
exports.listMyEvents = function (req, res) {
	models.Attendee.find({ 'user': req.user._id }, '_id', function(err, attendees) {
		models.Event.find({ 'attendees': { $in: attendees }})
			.populate('avatar attendees.user')
			.select('name start end address venue_name avatar')
			.sort('-created')
			.exec(function(err, evs) {
			if (err) throw err;
			if (evs) {
				res.format({
					html: function() {
						res.locals.moment = moment;
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
	})
}

exports.listNearEvents = function (req, res) {
	//TODO mongo doesn't like the geospacial index
	res.format({
		html: function() {
			res.render('event/list', { events: [], pagename: "Events near you", title: "Events nearby" })
		},
		json: function() {
			// TODO security issue. Sharing too much
			res.send({
				events: [],
				pagename: "Events near you"
			})
		}
	})
	return;
	
	var lat = parseFloat(req.query.lat)
		,lng = parseFloat(req.query.lng)
		,limit = parseInt(req.query.limit)
		,distance = req.query.distance
	
	if (!lat || !lng) {
		// render a blank page, and tell it to ask user for browser positioning
		res.format({
			html: function() {
				res.locals.moment = moment;
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
	
	console.log([lng, lat]);
	models.Geolocation.find(
		{ 'geo': {
				$near: {
					$geometry: {
						type: "Point",
						coordinates: [lng, lat]
					},
					$maxDistance: 0.9
				}
			}
		}).populate('event')
		.limit(limit)
		.select('name start end address venue_name avatar')
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
				
				// May slow the app down.. Mongoose does not seem to support sub-document population (event.avatar)
				async.each(geos, function(geo, cb) {
					if (geo.event)
						geo.event.populate('avatar', cb);
					else
						cb(null)
				}, function(err) {
					res.format({
						html: function() {
							res.render('event/list', { events: events, pagename: "Events near you", title: "Events nearby" })
						},
						json: function() {
							// TODO security issue. Sharing too much
							res.send({
								events: events,
								pagename: "Events near you"
							})
						}
					})
				})
				
			}
		}
	);
}