var models = require('../../models')
	, util = require('../../util')
	, async = require('async')
	, moment = require('moment')
	, jade = require('jade')
	, config = require('../../config')

exports.router = function (app) {
	app.get('/events', exports.listEvents)
		.get('/events/my', util.authorized, exports.listMyEvents)
		.get('/events/near', exports.listNearEvents)
}

exports.listEvents = function (req, res) {
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
	
	models.Event.find(query)
		.populate('avatar attendees.user')
		.select('name start end address venue_name avatar source')
		.sort('-created')
		.limit(10)
		.skip(skip)
		.exec(function(err, evs) {
		if (err) throw err;
		if (evs) {
			models.Event.find(query).count(function(err, total) {
				res.format({
					html: function() {
						res.locals.eventsTotal = total;
						res.locals.eventsSkip = skip;
						res.locals.pageURL = '/events';
						
						res.locals.moment = moment;
						res.render('event/list', { events: evs, pagename: "Events", title: "Events" });
					},
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
exports.listMyEvents = function (req, res) {
	var skip = req.query.skip || 0;
	
	models.Attendee.find({ 'user': req.user._id }, '_id', function(err, attendees) {
		var query = { 'attendees': { $in: attendees } };
		
		models.Event.find(query)
			.populate('avatar attendees.user')
			.select('name start end address venue_name avatar source')
			.sort('-created')
			.skip(skip)
			.exec(function(err, evs) {
			if (err) throw err;
			if (evs) {
				models.Event.find(query).count(function(err, total) {
					res.format({
						html: function() {
							res.locals.eventsTotal = total;
							res.locals.eventsSkip = skip;
							res.locals.pageURL = '/events/my';
						
							res.locals.moment = moment;
							res.render('event/list', { events: evs, pagename: "My Events", title: "My Events" });
						},
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

exports.listNearEvents = function (req, res) {
	var lat = parseFloat(req.query.lat)
		, lng = parseFloat(req.query.lng)
		, limit = parseInt(req.query.limit)
		, distance = req.query.distance
		, htmlIsEnabled = Boolean(req.query.html)
		, page = parseInt(req.query.page)

	if (!lat || !lng) {
		// render a blank page, and tell it to ask user for browser positioning
		res.format({
			html: function() {
				res.locals.moment = moment;
				res.render('search/results', { nearby: true, search: { results: [] }, moment:moment, title: "Events nearby" })
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
	
	var query = {
		'geo': {
			$geoWithin: {
				$center: [
					[lng, lat],
					0.2
				]
			}
		}
	};
	models.Geolocation.find(query).populate({
		path: 'event',
		select: 'name start end address venue_name avatar source',
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
						html: function() {
							res.render('search/results', { nearby: true, search: { results: events }, moment:moment, title: "Events nearby" })
						},
						json: function() {
							if (events.length > 0 && htmlIsEnabled) {
								models.Geolocation.find(query).count(function(err, count) {
									var html = jade.renderFile(config.path + '/views/event/listBlank.jade', {
										moment: moment,
										events: events,
										eventsTotal: count,
										eventsSkip: limit * page
									});

									res.send({
										html: html,
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

exports.listNearLandingEvents = function (req, res) {
	var lat = parseFloat(req.query.lat)
		, lng = parseFloat(req.query.lng)
		, limit = parseInt(req.query.limit)
		, distance = req.query.distance
		, htmlIsEnabled = Boolean(req.query.html)
		, page = parseInt(req.query.page)

		

	console.log("lat: "+lat+" lng: "+lng);

	if (!lat || !lng) {

		// render a blank page, and tell it to ask user for browser positioning
		res.format({
			html: function() {

				console.log("Should be normal events");
				
				var firstDay = new Date();
				var nextWeek = new Date(firstDay.getTime() + 7 * 24 * 60 * 60 * 1000);

				var query = {
					//name: new RegExp(q, 'i'),
					//name: "Value in Healthcare Forum (ViHF): Hellish Decisions in Healthcare",
					deleted: false,
					start: {
						$gte: new Date()
					},
					end: {
						$lte: nextWeek
					}
					
				};

				
				models.Event.find(query).limit(100).populate('avatar').sort('start').exec(function(err, evs) {

					//Cleaning up the description...

					evs.forEach(function(entry) {
						
						if((entry.description) && entry.description != ''){

							//console.log(entry.description);
							entry.description = entry.description.replace(/(<([^>]+)>)/ig,"");
							entry.description = entry.description.substr(0, 200)+"...";

						}
					});

					res.locals.moment = moment;
					res.render('search/landing', { nearby: true, search: { results: evs}, moment:moment, title: "EventMost" })
				});

				
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
		limit = 100;
	}


	
	var query = {
		'geo': {
			$near : [lng,lat], $maxDistance : 10/111.12
		}
	};

	console.log("aboout to fetch near events");
	models.Geolocation.find(query).populate({
		path: 'event',
		select: 'name description start end address venue_name avatar source',
		match: {
			deleted: false,
			/*privateEvent: {
				$ne: true
			},*/
			start: { $gte: Date.now() }
		},
	}).limit(limit)
		.skip(limit * page)
		.exec(function(err, geos) {
			if (err) throw err;
			console.log("found geos?");
			if (geos) {
				//console.log(geos);
				var events = [];
				
				for (var i = 0; i < geos.length; i++) {

					
					//console.log(geos[i]);
					if (geos[i].event == null) {
						continue;

					}
					if (geos[i].event.deleted != true) {
						//geos[i].event.avatar = JSON.stringify({"avatar" : {'url': 'test url'}});
						geos[i].event.geo = geos[i].geo;
						geos[i].event.description = geos[i].event.description.replace(/(<([^>]+)>)/ig,"");
						geos[i].event.description = geos[i].event.description.substr(0, 200)+"...";

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
							console.log("redering the view");
							console.log(events);
							res.render('search/landing', { nearby: true, gotEvents : true, search: { results: events }, moment:moment, title: "Events nearby" })
						},
						json: function() {
							console.log("redering the json");

							if (events.length > 0 && htmlIsEnabled) {
								models.Geolocation.find(query).count(function(err, count) {
									var html = jade.renderFile(config.path + '/views/event/listBlank.jade', {
										moment: moment,
										events: events,
										eventsTotal: count,
										eventsSkip: limit * page
									});

									res.send({
										html: html,
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
