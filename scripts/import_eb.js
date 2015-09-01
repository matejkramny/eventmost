/*
var firstDay = new Date();
var nextWeek = new Date(firstDay.getTime() + 7 * 24 * 60 * 60 * 1000);
var range_start = firstDay.toISOString();
var range_end = nextWeek.toISOString();

*/

/*
var now = new Date();
var nextWeek = new Date(now);
nextWeek.setDate(nextWeek.getDate() + 6);

now.setHours(0);
now.setMinutes(0);
now.setSeconds(0);

nextWeek.setHours(23);
nextWeek.setMinutes(59);
nextWeek.setSeconds(0);

var range_start = now.toISOString();
var range_end = nextWeek.toISOString();

console.log("Fetching eventbrite events from: "+range_start+" -to- "+range_end);*/

/*var now = new Date();
var range_start = new Date(now);
var range_end = new Date(now);
range_start.setDate(range_start.getDate() + 1);
range_end.setDate(range_end.getDate() + 1);

range_start.setHours(0);
range_start.setMinutes(0);
range_start.setSeconds(0);

range_end.setHours(23);
range_end.setMinutes(59);
range_end.setSeconds(0);

range_start = range_start.toISOString();
range_end = range_end.toISOString();

console.log("Fetching Events from: "+range_start+" --- "+range_end);

var testURL = "https://www.eventbriteapi.com/v3/events/search/?venue.city=london&start_date.range_end=2015-05-31T00%3A00%3A25Z&start_date.range_start=2015-05-30T00%3A00%3A10Z&token=AA4GISV6PONEGUPPZ34T";
var token = "AA4GISV6PONEGUPPZ34T";
var apiURL = "https://www.eventbriteapi.com/v3/events/search/?";

require('../app');

var models = require('../models'),
	async = require('async'),
	request = require('request');

async.series([
			function(){
				request(testURL, function(err, res, body) {
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
					
					self.parsePage(events_mix, function() {
						if (page < pages) self.getPage(page + 1);
						else {
							console.log("I AM FINISHED! :P");
							download_finished();
						}
					});
					console.log(parsed);
				});
			}

			],function(err, results){
				console.log("done");
				process.exit(0);
			}); */

var now = new Date();
var range_start = new Date(now);
var range_end = new Date(now);
range_start.setDate(range_start.getDate() + 1);
range_end.setDate(range_end.getDate() + 7);

range_start.setHours(0);
range_start.setMinutes(0);
range_start.setSeconds(0);

range_end.setHours(23);
range_end.setMinutes(59);
range_end.setSeconds(00);

range_start = range_start.toISOString();
range_end = range_end.toISOString();

//2015-05-31T19:00:00.635Z

range_start = range_start.split(".");
range_start = range_start[0]+"Z";

range_end = range_end.split(".");
range_end = range_end[0]+"Z";

console.log("Fetching Events from: "+range_start+" --- "+range_end);

require('../app');

var models = require('../models'),
	async = require('async'),
	request = require('request')
	
var api = 'https://www.eventbriteapi.com/v3/events/search/';
var api_venues = "https://www.eventbriteapi.com/v3/venues/"
var app_key = 'token=AA4GISV6PONEGUPPZ34T';

async.eachSeries(['London'], function(city, cb) {
	new download(city, cb);
}, function() {
	console.log("Done");
	process.exit(0);
});

function download (city, download_finished) {
	var self = this;

	this.getPage = function (page) {
		console.log("requesting page", page)
		request(
			[api,
			'?', app_key,
			'&', 'venue.city='+city,
			'&', 'start_date.range_start='+range_start,
			'&', 'start_date.range_end='+range_end,
			'&', 'page=', page].join(''), function(err, res, body) {
				if (err) throw err;
			
				var parsed = null
				try {
					parsed = JSON.parse(body);
				} catch (e) {
					console.log("Error parsing JSON")
					throw e;
				}
				console.log(api+"?"+app_key+"&venue.city="+city+"&start_date.range_start="+range_start+"&start_date.range_end="+range_end);
				//console.log(parsed);
			
				var events_mix = parsed.events;
			
				//var num = parsed.pagination.page_count;
				//var total = parsed.pagination.object_count;
				pages = parsed.pagination.page_count;
				page = parsed.pagination.page_number;
				total = parsed.pagination.object_count;
				
				//var pages = Math.floor(total / num);
				if (page == 1) console.log(total, 'Total Events,', pages, ' pages');
				
				console.log("Have", pages - page, " more pages to go through");
				
				self.parsePage(events_mix, function() {
					if (page < pages) self.getPage(page + 1);
					else {
						console.log("I AM FINISHED! :P");
						download_finished();
					}
				});
		})
	}

	this.parsePage = function (evs, cb) {
		// Remove the Summary object
		//evs.splice(0, 1);
		
		// Filter existing events..


		async.reject(evs, function(evn, cb) {
			models.Event.findOne({
				"source.eventbrite": true,
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
			
			async.eachSeries(filtered, self.parseEvent, function(err) {
				if (err) throw err;
				
				cb()
			})
		});
	}

	this.parseEvent = function (ev, cb) {

		async.waterfall([
		    function(callback) {
		    	if (ev.logo) {

					var av = new models.Avatar({
						url: ev.logo.url
					});

					av.save();

				} else {

					var av = new models.Avatar({
						url: "/images/event-avatar-new.svg"
					});

					av.save();
				}
		        callback(null, av);
		    },
		    function(av, callback){
		    	request(api_venues+ev.venue_id+"/?"+app_key, function(err, res, vnbody) {
					venueObj = JSON.parse(vnbody);
					callback(null, av, venueObj)
				});
		    },
		    function(av, venueObj, callback) {
		      	var eventDoc = {
					source: {
						eventbrite: true,
						id: ev.id
					},
					name: ev.name.text
				};

				if (ev.description) {
					eventDoc.description = ev.description.text;
				}
				if (ev.start) {
					eventDoc.start = new Date(ev.start.local);
				} else {
					eventDoc.start = new Date();
				}
				if (ev.end) {
					eventDoc.end = new Date(ev.end.local);
				} else {
					eventDoc.end = new Date();
				}
				if (ev.created) {
					eventDoc.created = new Date(ev.created);
				} else {
					eventDoc.created = new Date();
				}
	 
				eventDoc.address = "";
				haveAddress = false;
				if(venueObj){
					if (venueObj.name) {
						eventDoc.venue_name = venueObj.name;
					}
					if (venueObj.address.address_1 && venueObj.address.address_1 != null) {
						eventDoc.address += venueObj.address.address_1;
						haveAddress = true;
					}
					if (venueObj.address.city && venueObj.address.city != '') {
						if(haveAddress == true){
							eventDoc.address += ', ';
						}
						eventDoc.address += venueObj.address.city;
						haveAddress = true;
					}
					if (venueObj.address.postal_code && venueObj.address.postal_code != '') {
						if(haveAddress == true){
							eventDoc.address += ', ';
						}
						eventDoc.address += venueObj.address.postal_code;
					}
				}else{
					eventDoc.address = city;
				}
				

				eventDoc.avatar = av._id;

				var e = new models.Event(eventDoc);
				e.save();
		        callback(null, e);
		    },
		    function(entry, callback) {
		        if (ev.venue && ev.venue.latitude && ev.venue.longitude) {
					var geo = new models.Geolocation({
						geo: {
							lat: ev.venue.latitude,
							lng: ev.venue.longitude
						},
						event: entry._id
					});
					geo.save();
				}
		        callback(null, entry);
		    },
		    function(entry, callback) {
		        
		        var smeta = new models.SocialMetadata({
					type: 'EventBriteEvent',
					meta: ev,
					event: entry._id
				});

		        smeta.save(function(err){
		        	callback(null, entry);
		        });
		    }
		], function (err, result) {
		    
		    console.log("Inserted Eventbrite event "+result._id);
			//download_finished();
			cb(null);
		});
	}

	this.getPage(1);
}






