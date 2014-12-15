var models = require('../../../../models')
	, util = require('../../util')
	, async = require('async')
	, moment = require('moment')
	, config = require('../../../../config')

exports.router = function (app) {
	app.get('/api/events', exports.listEventsAPI)
		.post('/api/events/my', util.authorized, exports.listMyEventsAPI)
		.get('/api/events/near', exports.listNearEventsAPI)
		.post('/api/sortedevents', exports.sortedevents)
}

exports.listEventsAPI = function (req, res) {
	console.log(config.path);

	var skip = req.query.skip || 0;
	var showPastEvents = req.query.pastEvents == "1" ? true : false;
	if (!showPastEvents || typeof showPastEvents === 'undefined') {
		showPastEvents = false;
	} else {
		showPastEvents = Boolean(showPastEvents);
	}
	
	var query = {
		deleted: false,
		privateEvent: {
			$ne: true 
		}
	};
	if (!showPastEvents) {
		query.start = { $gte: Date.now() };
	}
	
	models.Event.find(query)
		.populate('avatar attendees.user')
		.select('name start end address venue_name avatar source description')
		.sort('-created')
		.limit(50)
		.skip(skip)
		.exec(function(err, evs) {
			
		if (err) throw err; 
		if (evs) {
			models.Event.find(query).count(function(err, total) {
				res.format({
					json: function() {
						res.send({
							events: evs,
							total: total,
							skip: skip,
							pagename: "EventMost Events"
						})
					}
				});
			});
		}
	})
}

exports.sortedevents = function (req, res) {
	var sortby = req.body.sortby;
	var skip = req.query.skip || 0;
	var showPastEvents = req.query.pastEvents;
	if (!showPastEvents || typeof showPastEvents === 'undefined') {
		showPastEvents = false;
	} else {
		showPastEvents = Boolean(showPastEvents);
	}
	
	var query = {
		deleted: false,
		privateEvent: {
			$ne: true 
		}

	};
	if (!showPastEvents) {
		query.start = { $gte: Date.now() };
	}

	if(sortby == 1){
		sortquery = {"created" : -1};
	}else if(sortby == 2){
		sortquery = {"created" : 1};
	}else{
		sortquery = {"name" : 1};
	}
	
	
	models.Event.find(query)
		.populate('avatar attendees.user')
		.select('name start end address venue_name avatar source description')
		.sort(sortquery)
		.limit(50)
		.skip(skip)
		.exec(function(err, evs) {
		if (err) throw err; 
		if (evs) {
			models.Event.find(query).count(function(err, total) {
				res.format({
					json: function() {
						res.send({
							events: evs,
							total: total,
							skip: skip,
							pagename: "EventMost Events"
						})
					}
				});
			});
		}
	})
}

// TODO fix this
exports.listMyEventsAPI = function (req, res) {
	
	var skip = req.body.skip || 0;
	
	models.Attendee.find({ 'user': req.body._id }, '_id', function(err, attendees) {
		var query = { 'attendees': { $in: attendees } };
		
		models.Event.find(query)
			.populate('avatar attendees.user')
			.select('name start end address venue_name avatar source description')
			.sort('-created')
			.skip(skip)
			.exec(function(err, evs) {
				
				
			if (err) throw err;
			if (evs) {
				models.Event.find(query).count(function(err, total) {
					
					res.format({
						json: function() {
							res.send({
								events: evs,
								total: total,
								skip: skip,
								pagename: "My Events"
							})
						}
					})
				});
			}
		})
	})
}

exports.listNearEventsAPI = function (req, res) {
	
	console.log();
	console.log("/api/events/near ".red);
	console.log(req);
	
	console.log("lat: "+req.query.lat)
	var lat = parseFloat(req.query.lat)
		, lng = parseFloat(req.query.lng)
		, limit = parseInt(req.query.limit)
		, distance = req.query.distance
		, htmlIsEnabled = Boolean(req.query.html)
		, page = parseInt(req.query.page)

	if (!lat || !lng) {
		// render a blank page, and tell it to ask user for browser positioning
		res.format({
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
	
	var query = {
		'geo': {
			$near : [lng,lat], $maxDistance : 10/111.12
		}
	};
	models.Geolocation.find(query).populate({
		path: 'event',
		select: 'name start end address venue_name avatar source description',
		match: {
			deleted: false,
			privateEvent: {
				$ne: true
			},
			start: { $gte: Date.now() }
		},
	}).limit(limit)
		.skip(limit * page)
		.exec(function(err, geos) {
			if (err) throw err;
			console.log(geos);
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
						json: function() {
							if (events.length > 0 && htmlIsEnabled) {
								models.Geolocation.find(query).count(function(err, count) {
									res.send({
										pagename: "Events near you",
										events: events
									});
								})

								return;
							}

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
