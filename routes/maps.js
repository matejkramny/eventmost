var http = require('http')
	,models = require('../models')

exports.router = function (app) {
	app.get('/rgeocode.json', reverseGeoCode)
		.get('/near.json', near)
		.get('/geocode.json', geoCode);
}

exports.reverseGeoCode = reverseGeoCode = function (req, res) {
	var latlng = req.query.latlng;
	if (!latlng) {
		res.status(200);
		res.end("{}")
		return;
	}
	
	var reqOptions = {
		host: "maps.googleapis.com",
		path: "/maps/api/geocode/json?latlng="+latlng+"&sensor=true"
	}
	
	var callback = function (response) {
		var data = ''
		response.on('data', function(chunk) {
			data += chunk;
		})
		.on('end', function() {
			res.status(200);
			res.send(JSON.stringify(JSON.parse(data).results))
		});
	}
	
	http.request(reqOptions, callback).end();
}

exports.geoCode = geoCode = function (req, res) {
	console.log(req.query)
	var address = req.query.address;
	if (!address) {
		res.status(200);
		res.end("{}")
		return;
	}
	
	var reqOptions = {
		host: "maps.googleapis.com",
		path: "/maps/api/geocode/json?address="+encodeURI(address)+"&sensor=true"
	}
	
	var callback = function (response) {
		var data = ''
		response.on('data', function(chunk) {
			data += chunk;
		})
		.on('end', function() {
			res.status(200);
			console.log(data)
			res.send(JSON.stringify(JSON.parse(data).results))
		});
	}
	
	http.request(reqOptions, callback).end();
}

exports.near = near = function (req, res) {
	var lat = parseFloat(req.query.lat)
		,lng = parseFloat(req.query.lng)
		,limit = req.query.limit
		,distance = req.query.distance
	
	models.Event.find(
		{ 'location':
			{
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
			console.log(evs);
			if (evs) {
				res.status(200);
				res.send(JSON.stringify(evs))
			}
		}
	);
}