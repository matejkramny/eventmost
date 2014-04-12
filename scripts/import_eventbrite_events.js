require('../app');

var models = require('../models'),
	async = require('async'),
	request = require('request')
	
var api = 'https://www.eventbrite.com/json/';
var app_key = 'app_key=OE3EEKIOROOQOPN2ZC';

getPage(1);

function getPage (page) {
	console.log("requesting page", page)
	request(
		[api,
		'event_search',
		'?', app_key,
		'&', 'city=Oxford',
		'&', 'page=', page].join(''), function(err, res, body) {
			if (err) throw err;
		
			var parsed = null
			try {
				parsed = JSON.parse(body);
			} catch (e) {
				console.log("Error parsing JSON")
				throw e;
			}
		
			var events_mix = parsed.events;
		
			var num = events_mix[0].summary.num_showing;
			var total = events_mix[0].summary.total_items;
			
			var pages = Math.floor(total / num);
			if (page == 1) console.log(total, 'Total Events,', pages, ' pages');
			
			console.log("Have", pages - page, " more pages to go through");
			
			parsePage(events_mix, function() {
				if (page < pages) getPage(page + 1);
				else {
					console.log("I AM FINISHED! :P");
					process.exit(0);
				}
			});
	})
}

function parsePage(evs, cb) {
	// Remove the Summary object
	evs.splice(0, 1);
	
	// Filter existing events..
	async.reject(evs, function(evn, cb) {
		models.Event.findOne({
			"source.eventbrite": true,
			"source.id": evn.event.id
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
		
		async.eachSeries(filtered, parseEvent, function(err) {
			if (err) throw err;
			
			cb()
		})
	});
}

function parseEvent (ev, cb) {
	ev = ev.event;
	
	var e = new models.Event({
		source: {
			eventbrite: true,
			id: ev.id
		},
		name: ev.title
	});
	
	if (ev.venue && ev.venue.name) {
		e.venue_name = ev.venue.name;
	}
	if (ev.description) {
		e.description = ev.description;
	}
	
	if (ev.start_date) {
		e.start = new Date(ev.start_date);
	} else {
		e.start = new Date();
	}
	if (ev.end_date) {
		e.end = new Date(ev.end_date);
	} else {
		e.end = new Date();
	}
	if (ev.created) {
		e.created = new Date(ev.created);
	} else {
		e.created = new Date();
	}
	
	if (ev.logo) {
		var av = new models.Avatar({
			url: ev.logo
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
	
	if (ev.venue && ev.venue.latitude && ev.venue.longitude) {
		var geo = new models.Geolocation({
			geo: {
				lat: ev.venue.latitude,
				lng: ev.venue.longitude
			},
			event: e._id
		});
		geo.save();
	}
	
	e.address = "";
	if (ev.venue.name) {
		e.address += ev.venue.name;
	}
	if (ev.venue.address) {
		e.address += ', '+ev.venue.address;
	}
	if (ev.venue.address_2) {
		e.address += ', '+ev.venue.address_2;
	}
	if (ev.venue.city) {
		e.address += ', '+ev.venue.city;
	}
	if (ev.venue.postal_code) {
		e.address += ', '+ev.venue.postal_code;
	}
	
	var smeta = new models.SocialMetadata({
		type: 'EventBriteEvent',
		meta: ev,
		event: e._id
	});
	smeta.save();
	
	e.save()
	
	console.log("Inserted Eventbrite event "+e._id);
	cb(null)
}