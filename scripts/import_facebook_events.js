require('../app');

var models = require('../models'),
	async = require('async'),
	graph = require('fbgraph')

graph.setAccessToken('CAACEdEose0cBAHB7a78rYPnXcEsdwpEicnZARFg0XJfXTSrBJyKeW9DlI2e5We2F0GYcGiwkuR1ooaE2pU3PrkbXsOA6xT9XcktpjZB6ClFZBa3I1FH7hDy2gYd3n6Cqfk8aZC8AsROtwvbk32aZBZBjYAfyyYDYl9zPlZCEZBwPlLxTBkOvYgNur0VZBy3dBkS4ZD');

graph.search({
	type: 'event',
	q: 'Oxford',
	fields: 'name,location,start_time'
}, function(err, res) {
	if (err) throw err;
	
	console.log('found', res.data.length, 'events');
	
	console.log("Filtering.");
	
	async.reject(res.data, function(evn, cb) {
		models.Event.findOne({
			"source.facebook": true,
			"source.id": parseInt(evn.id)
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
		
		var i = 0;
		setInterval(function() {
			if (i < filtered.length) {
				
				farm(filtered[i]);
				
				i++;
			}
		}, 1000);
	});
})

var fields = { fields: 'cover,description,end_time,location,name,start_time,owner,ticket_uri,venue' };
function farm(ev) {
	var evid = parseInt(ev.id);
	
	graph.get(ev.id, fields, function(err, res) {
		if (err) throw err;
		
		var e = new models.Event({
			name: res.name,
			source: {
				facebook: true,
				id: parseInt(ev.id)
			}
		})
		
		if (res.description) {
			e.description = res.description.replace(/\n/g, "<br/>");
		}
		
		if (res.cover && res.cover.source) {
			var av = new models.Avatar({ url: res.cover.source });
			av.save();
			
			e.avatar = av._id;
		} else {
			var av = new models.Avatar({
				url: "/images/event-avatar-new2.svg"
			})
			av.save();
			
			e.avatar = av._id;
		}
		
		if (res.start_time) {
			e.start = new Date(res.start_time);
		} else {
			e.start = new Date();
		}
		if (res.end_time) {
			e.end = new Date(res.end_time)
		} else if (res.start_time) {
			e.end = new Date(e.start.getTime() + 60 * 60 * 24 * 1000);
			//new Date(e.start.getFullYear(), e.start.getMonth(), e.start.getDate(), e.start.getHours(), e.start.getMinutes(), e.start.getSeconds());
		} else {
			e.end = new Date(Date.now() + 60 * 60 * 24 * 1000);
		}
		
		if (res.location) {
			e.address = res.location;
		}
		if (res.venue) {
			if (res.venue.name) {
				e.venue_name = res.venue.name;
			} else {
				e.venue_name = "";
				if (res.venue.street) {
					e.venue_name = res.venue.street;
				}
			}
			
			if (res.venue.latitude && res.venue.longitude) {
				var geo = new models.Geolocation({
					geo: {
						lat: res.venue.latitude,
						lng: res.venue.longitude
					},
					event: e._id
				});
				geo.save();
			}
		}
		
		var smeta = new models.SocialMetadata({
			type: 'FacebookEvent',
			meta: res,
			event: e._id
		});
		smeta.save();
		
		e.save()
		
		console.log("Inserted: "+e._id)
	})
}