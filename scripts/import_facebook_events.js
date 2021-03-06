require('../app');

var models = require('../models'),
	async = require('async'),
	graph = require('fbgraph')

graph.setAccessToken('CAAFYgmwS48gBAGlIVBFAnZBrlHXAyDp50KgOesyPMZB0HbpuqzqdxiY216MnQzhVYFrDPq5hY26MXWWevtrLw8JXclskMtEc2bVPJ19ZBcbt1dZAA55n9Dv35sZB7tvC7AZC42ZAi8ar0K7ApuGvdQHQ4Y4KNBIjveZCWGUs1ZAmxUx6oBz1RmYHrZCutvo89tZCK4ZD');

var dict = require('fs').readFileSync("/usr/share/dict/words", {
	encoding: 'utf8'
}).split('\n');
var pos = 0;

function search (q) {
	console.log();
	console.log('Searching for', q, 'position', pos);
	console.log('...-----------------');
	graph.search({
		type: 'event',
		q: q,
		fields: 'name,location,start_time',
		limit: 300
	}, getPage);
}

search(dict[pos]);

function getPage (err, res) {
	if (err) throw err;

	console.log('found', res.data.length, 'events');
	
	console.log("Filtering.");
	
	if (res.data.length == 0) {
		// search for next word
		setTimeout(function() {
			search(dict[++pos]);
		}, 1000);
		return;
	}

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
		var interval = setInterval(function() {
			if (i < filtered.length) {
				
				farm(filtered[i]);
				
				i++;
			} else {
				console.log("Clearing interval");
				clearInterval(interval);

				if (res.paging && res.paging.next) {
					console.log("Getting next page..")
					graph.get(res.paging.next, getPage);
				}
			}
		}, 1000);
	});
};

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
				url: "/images/event-avatar-new.svg"
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