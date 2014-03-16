require('../app');

var models = require('../models'),
	async = require('async'),
	request = require('request')
	
var api = 'https://api.meetup.com/2/';
var key = 'key=34617a1c721e1f626d94250644578';

getVenue(0);

function getVenue (offset) {
	console.log("Requesting Venues, offset", offset)
	request(
		[api,
		'open_venues',
		'?', key,
		'&', 'city=Oxford',
		'&', 'country=GB',
		'&', 'offset=', offset].join(''), function(err, res, body) {
			if (err) throw err;
			
			var parsed = null
			try {
				parsed = JSON.parse(body);
			} catch (e) {
				console.log("Error parsing JSON")
				throw e;
			}
			
			var venues = parsed.results;
			
			var num = parsed.meta.count;
			var total = parsed.meta.total_count;
			
			var pages = Math.floor(total / num);
			if (offset == 0) console.log(total, 'Total Venues,', pages, ' pages');
			
			console.log("Have", pages - offset, " more pages to go through");
			
			getEvents(venues, function() {
				if (offset < pages) getVenue(offset + 1);
				else {
					console.log("I AM FINISHED! :P")
				}
			});
	})
}

function getEvents(venues, cb) {
	async.eachSeries(venues, function(venue, cb) {
		getEventsForVenue(venue, 0, function() {
			cb(null);
		})
	})
}

function getEventsForVenue(venue, offset, cb) {
	console.log("Requesting Events for Venue", offset)
	request(
		[api,
		'events',
		'?', key,
		'&', 'venue_id='+venue.id,
		'&', 'offset=', offset].join(''), function(err, res, body) {
			if (err) throw err;
			
			var parsed = null
			try {
				parsed = JSON.parse(body);
			} catch (e) {
				console.log("Error parsing JSON")
				throw e;
			}

			var evs = parsed.results;
			
			var num = parsed.meta.count;
			var total = parsed.meta.total_count;
			
			var pages = Math.floor(total / num);
			if (isNaN(pages)) pages = 0;
			if (!isFinite(pages)) pages = 0;

			if (offset == 0) console.log(total, 'Total Events,', pages, ' pages');
			
			console.log("(Event) Have", pages - offset, " more pages to go through");
			
			parseEvents(evs, venue, function() {
				if (offset < pages) getEventsForVenue(venue, offset+1, cb);
				else {
					console.log("I AM FINISHED! :P - parsing a venue")
					cb(null);
				}
			});
		})
}

function parseEvents (evs, venue, cb) {
	// Filter existing events..
	async.reject(evs, function(evn, cb) {
		models.Event.findOne({
			"source.meetup": true,
			"source.id": evn.id
		}, function(err, ev) {
			if (err) throw err;
			
			if (ev == null) {
				cb(false)
			} else {
				cb(true)
			}
		})
	}, function(filtered) {
		console.log('Parsing: ', filtered.length, 'events');
		
		async.eachSeries(filtered, function(ev, cb) {
			parseEvent(ev, venue, cb);
		}, function(err) {
			if (err) throw err;
			
			cb()
		})
	});
}

function parseEvent (ev, venue, cb) {
	var e = new models.Event({
		source: {
			meetup: true,
			id: ev.id,
			url: ev.event_url
		},
		name: ev.name,
		description: ev.description,

	});
	
	e.venue_name = venue.name;
	e.created = new Date(ev.created);
	e.start = new Date(ev.time);
	e.end = new Date(ev.time + ev.duration);
	
	if (ev.photo_url) {
		var av = new models.Avatar({
			url: ev.photo_url
		});
		av.save();

		e.avatar = av._id;
	} else {
		var av = new models.Avatar({
			url: "/images/event-avatar-new.svg"
		})
		av.save();
		
		e.avatar = av._id;
	}
	
	var geo = new models.Geolocation({
		geo: {
			lat: venue.lat,
			lng: venue.lon
		},
		event: e._id
	});
	geo.save();
	
	e.address = venue.address_1 + ', ' + venue.address_2 + ', ' + venue.city;
	
	var smeta = new models.SocialMetadata({
		type: 'MeetupEvent',
		meta: {
			event: ev,
			venue: venue
		},
		event: e._id
	});
	smeta.save();
	
	e.save()
	
	console.log("Inserted Meetup event "+e._id);
	cb(null)
}