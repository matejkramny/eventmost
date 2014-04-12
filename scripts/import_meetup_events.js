require('../app');

var models = require('../models'),
	async = require('async'),
	request = require('request')
	
var api = 'https://api.meetup.com/2/';
var key = 'key=34617a1c721e1f626d94250644578';

getVenue(0);

function getVenue (offset) {
	console.log("Requesting Events, offset", offset)
	request(
		[api,
		'open_events',
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

			var evs = parsed.results;
			
			var num = parsed.meta.count;
			var total = parsed.meta.total_count;
			
			var pages = Math.floor(total / num);
			if (isNaN(pages)) pages = 0;
			if (!isFinite(pages)) pages = 0;

			if (offset == 0) console.log(total, 'Total Events,', pages, ' pages');
			
			console.log("(Event) Have", pages - offset, " more pages to go through");
			
			parseEvents(evs, function() {
				if (offset < pages) getVenue(offset + 1);
				else {
					console.log("I AM FINISHED! :P")
				}
			});
	})
}

function parseEvents (evs, cb) {
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
			parseEvent(ev, cb);
		}, function(err) {
			if (err) throw err;
			
			cb()
		})
	});
}

function parseEvent (ev, cb) {
	var e = new models.Event({
		source: {
			meetup: true,
			id: ev.id,
			url: ev.event_url
		},
		name: ev.name,
		description: ev.description,

	});
	
	if (ev.venue) {
		e.venue_name = ev.venue.name;
	}
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
	
	if (ev.venue) {
		var geo = new models.Geolocation({
			geo: {
				lat: ev.venue.lat,
				lng: ev.venue.lon
			},
			event: e._id
		});
		geo.save();
		e.address = ev.venue.address_1 + ', ' + ev.venue.address_2 + ', ' + ev.venue.city;
	}
	
	var smeta = new models.SocialMetadata({
		type: 'MeetupEvent',
		meta: {
			event: ev
		},
		event: e._id
	});
	smeta.save();
	
	e.save()
	
	console.log("Inserted Meetup event "+e._id);
	cb(null)
}