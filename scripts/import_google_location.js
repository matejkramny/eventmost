require('../app');

var models = require('../models'),
	async = require('async'),
	request = require('request')

models.Event.find({
	'address': { $exists: true },
	$where: "this.address.length > 0",
	$or: [
		{
			"source.facebook": true
		},
		{
			"source.eventbrite": true
		}
	]
}, { _id: 1, address: 1 }, function(err, evs){
	if (err) throw err;
	
	console.log(evs.length)
	
	async.reject(evs, function(ev, cb) {
		models.Geolocation.find({
			event: ev._id
		}, function(err, geos) {
			if (err) throw err;
			
			if (geos.length > 0) cb(true);
			else cb(false);
		})
	}, function(filtered) {
		console.log(filtered.length, 'filtered..')
		
		async.eachSeries(filtered, getGeo, function(err) {
			if (err) throw err;
			
			console.log("done.")
		})
	});
})

function getGeo (ev, cb) {
	request(
		['http://maps.googleapis.com/maps/api/geocode/json?address=',
		ev.address,
		'&', 'sensor=false'].join(''), function(err, res, body) {
			if (err) throw err;
			
			var parsed = null;
			try {
				parsed = JSON.parse(body);
			} catch (e) {
				console.log("Error parsing JSON")
				throw e;
			}
			
			if (parsed.status === "ZERO_RESULTS") {
				console.log("Zero results..");
				cb(null);
				return;
			}
			if (parsed.status !== "OK") {
				console.log(parsed);
				cb("Not OK! :'(");
				return;
			}
			
			var location = parsed.results[0].geometry.location;
			console.log(location);
			
			var geo = new models.Geolocation({
				geo: {
					lat: location.lat,
					lng: location.lng
				},
				event: ev._id
			});
			geo.save()
			
			// A 'known' rate limit for google's api.. Prevents rate-related errors
			setTimeout(function(){cb(null)}, 500);
		})
}