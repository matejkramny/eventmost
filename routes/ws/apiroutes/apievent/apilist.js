var models = require('../../../../models')
	, util = require('../../util')
	, async = require('async')
	, moment = require('moment')
	, config = require('../../../../config')

exports.router = function (app) {
	app.get('/api/events', exports.listEventsAPI)
	.post('/api/events/my', exports.listMyEventsAPI)
	.get('/api/events/near/:lat/:lng', exports.listNearEventsAPI)
	.post('/api/sortedevents', exports.sortedevents)
	.post('/api/event/detail/:id', exports.eventdetails)
	.post('/api/events/all', exports.allevents)
	.get('/api/event/cat/:id',exports.geteventcategories)
	.get('/api/events/searchevents',exports.searchEvents)
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
		.select('name start end address venue_name avatar source description attendees')
		.sort('-created')
		.limit(50)
		.skip(skip)
		.lean()
		.exec(function(err, evs) {

		if (err) throw err; 
		if (evs) {
			models.Event.find(query).count(function(err, total) {

				evs.forEach(function(entry) {
					if(entry.avatar && entry.avatar.url){
						if(entry.avatar.url == '/images/event-avatar-new2.svg') {
							entry.avatar.url ='/images/event_avatar_new.png';
						} else if(entry.avatar.url == '/images/event-avatar-new.svg') {
							entry.avatar.url ='/images/event_avatar_new.png';
						}
						entry.avatar.url = util.editURL(entry.avatar.url);
					}

					if((entry.description) && entry.description != ''){

						//console.log(entry.description);
						entry.description = entry.description.replace(/(<([^>]+)>)/ig,"");
						//entry.description = entry.description.substr(0, 200)+"...";
					}


					if(entry.attendees){
						entry.attendees.forEach(function (thisAttendee){

							models.Attendee.findOne({"_id": thisAttendee}).exec(function (err, att){
								if(att) {
									if(att.admin == true){
										models.User.findOne({"_id": att.user}).exec(function (err, user){
											entry.organizer = user.surname == "" ? user.name : user.name+ " " + user.surname;
										})
									}
								}
							});
						});
					}

					if(entry.source.id){
						var url = 'https://';
						if (entry.source.eventbrite) {
							url += 'eventbrite.com/e/';
						} else if (entry.source.facebook) {
							url += 'facebook.com/events/';
						} else if (entry.source.meetup) {
							url += 'meetup.com/e/';
						}
						url += entry.source.id;

						if (entry.source.url) {
							url = entry.source.url;
						}

						entry.isForeign = true;
						entry.foreignUrl = url;
					}
				});

				

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

exports.eventdetails = function (req, res) {

	var attendeeObject = [];
	var messagesObject = [];
	var currentUser = req.body.uid;
	var isattending = false;
	var attendingas = "";
	var comments = null;
	var query = {"_id": req.params.id};

	models.Event.find(query)
		.populate('avatar attendees.user messages sponsorLayout.sponsor1 sponsorLayout.sponsor2 sponsorLayout.sponsor3')
		.select('name start end address venue_name avatar source description attendees messages sponsorLayout allowAttendeesToCreateCategories')
		.lean()
		.exec(function (err, ev) {

			try {
				var entry = ev[0];

				if(entry && entry.sponsorLayout){
					if(entry.sponsorLayout.sponsor1)
						entry.sponsorLayout.sponsor1.url = util.editURL(entry.sponsorLayout.sponsor1.url);
					if(entry.sponsorLayout.sponsor2)
						entry.sponsorLayout.sponsor2.url = util.editURL(entry.sponsorLayout.sponsor2.url);
					if(entry.sponsorLayout.sponsor3)
						entry.sponsorLayout.sponsor3.url = util.editURL(entry.sponsorLayout.sponsor3.url);
				}

				async.series([
					function (callback) {
						if(entry.avatar && entry.avatar.url){
							if(entry.avatar.url == '/images/event-avatar-new2.svg') {
								entry.avatar.url ='/images/event_avatar_new.png';
							} else if(entry.avatar.url == '/images/event-avatar-new.svg') {
								entry.avatar.url ='/images/event_avatar_new.png';
							}
						}

						if (entry.attendees) {
							models.Attendee.find({"_id": {$in: entry.attendees}}).populate('user').lean().exec(function (err, att) {
								entry.attendees = [];
								att.forEach(function (thisAtt) {
									if (thisAtt.user) {
										if (thisAtt.admin == true || entry.organizer == undefined) {
											entry.organizer = {
												name:  thisAtt.user.surname == "" ? thisAtt.user.name : thisAtt.user.name + " " + thisAtt.user.surname,
												id: thisAtt.user._id
											}
										}

										if (thisAtt.user._id.toString() == currentUser && thisAtt.isAttending) {
											isattending = true;
											attendingas = thisAtt.category;
										}

										var user = {
											_id: thisAtt.user._id,
											email: thisAtt.user.email,
											lastAccess: thisAtt.user.lastAccess,
											admin: thisAtt.user.admin,
											businessCards: thisAtt.user.businessCards,
											avatar: util.editURL(thisAtt.user.avatar),
											interests: thisAtt.user.interests,
											education: thisAtt.user.education,
											website: thisAtt.user.website,
											location: thisAtt.user.location,
											company: thisAtt.user.company,
											desc: thisAtt.user.desc,
											position: thisAtt.user.position,
											surname: thisAtt.user.surname,
											name: thisAtt.user.name,
											disabled: thisAtt.user.disabled,
											created: thisAtt.user.created
										}

										attendeeObject.push({
											"_id": thisAtt._id,
											"name": thisAtt.user.name,
											"avatar": util.editURL(thisAtt.user.avatar),
											"admin": thisAtt.admin,
											"category": thisAtt.category,
											"haspaid": thisAtt.hasPaid,
											"checkedoff": thisAtt.checkedOff,
											"user": user
										});
									}

								});

								entry.attendees = attendeeObject;
								console.log("EventDetail: attendees " + att.length)
								callback(null, 'one');
							});
						} else {
							callback(null, 'one');
						}

					},
					function (callback) {
						if (entry.messages) {
							models.EventMessage.find({"_id": {$in: entry.messages}}).populate("attendee attendee.user comments").populate("likes").lean().exec(function (err, mes) {
								entry.messages = [];

								var count = 0;

								if (mes.length <= 0) {
									callback(null, "two");
									return;
								}

								mes.forEach(function fore(thisMessage) {
									page = models.User.findOne({"_id": thisMessage.attendee.user}).exec(function (err, user) {

										if(user) {
											thisMessage.attendee.user = {
												_id: user._id,
												email: user.email,
												lastAccess: user.lastAccess,
												admin: user.admin,
												businessCards: user.businessCards,
												avatar: util.editURL(user.avatar),
												interests: user.interests,
												education: user.education,
												website: user.website,
												location: user.location,
												company: user.company,
												desc: user.desc,
												position: user.position,
												surname: user.surname,
												name: user.name,
												disabled: user.disabled,
												created: user.created
											}
										} else {
											thisMessage.attendee.user = "";
											thisMessage.attendee.isAttending = false;
										}

										messagesObject.push({
											"_id": thisMessage._id,
											"message": thisMessage.message,
											"posted": thisMessage.posted,
											"spam": thisMessage.spam,
											"isResponse": thisMessage.isResponse,
											"attendee": thisMessage.attendee, // only attendees can post comment
											"likes": thisMessage.likes, //Only attendees can like
											"comments": thisMessage.comments
										});


										if (++count == mes.length) {
											entry.messages = messagesObject;
											callback(null, "two");
										}
									});
								});

							})
						} else {
							callback(null, "two");
						}
					}], function (err, results) {
					console.log("entering final");
					if ((entry.description) && entry.description != '') {
						entry.description = entry.description.replace(/(<([^>]+)>)/ig, "");
					}

					if (entry && entry.avatar)
						entry.avatar.url = util.editURL(entry.avatar.url);

					res.format({
						json: function () {
							res.send({
								status: 200,
								event: entry,
								attending: isattending,
								attendingAs: attendingas
							});
						}
					});
				});
			} catch(e) {
				console.log(e);
				res.format({
					json: function () {
						res.send({
							status: 404,
							err: e
						});
					}
				});
			}

		});
}

exports.sortedevents = function (req, res) {

	var sortby = req.body.sortby;
	var skip = req.body.skip || 0;
	var limit = req.body.limit || 50;
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
		sortquery = {"start" : -1};
	}else if(sortby == 2){
		sortquery = {"start" : 1};
	}else{
		sortquery = {"name" : 1};
	}
	
	models.Event.find(query)
		.populate('avatar attendees.user')
		.select('name start end address venue_name avatar source description')
		.sort(sortquery)
		.limit(limit)
		.skip(skip)
		.exec(function(err, evs) {
		if (err) throw err; 
		if (evs) {
			models.Event.find(query).count(function(err, total) {

				evs.forEach(function(entry) {

					if((entry.description) && entry.description != ''){

						//console.log(entry.description);
						entry.description = entry.description.replace(/(<([^>]+)>)/ig,"");
						//entry.description = entry.description.substr(0, 200)+"...";
					}
					if(entry.avatar && entry.avatar.url){
						if(entry.avatar.url == '/images/event-avatar-new2.svg') {
							entry.avatar.url ='/images/event_avatar_new.png';
						} else if(entry.avatar.url == '/images/event-avatar-new.svg') {
							entry.avatar.url ='/images/event_avatar_new.png';
						}
						entry.avatar.url = util.editURL(entry.avatar.url);
					}
					
				});

				res.format({
					json: function() {
						res.send({
							status: 200,
							total: total,
							skip: skip,
							limit: limit,
							events: evs
						})
					}
				});
			});
		}else{
			res.format({
				json: function() {
					res.send({
						status: 404,
						message: "No Event Found!"
					})
				}
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

					evs.forEach(function(entry) {

						if((entry.description) && entry.description != ''){

							//console.log(entry.description);
							entry.description = entry.description.replace(/(<([^>]+)>)/ig,"");
							//entry.description = entry.description.substr(0, 200)+"...";
						}

						if (entry.avatar && entry.avatar.url){
							if(entry.avatar.url == '/images/event-avatar-new2.svg') {
								entry.avatar.url ='/images/event_avatar_new.png';
							} else if(entry.avatar.url == '/images/event-avatar-new.svg') {
								entry.avatar.url ='/images/event_avatar_new.png';
							}
							entry.avatar.url = util.editURL(entry.avatar.url);
						}


						if (entry.attendee && entry.attendee.user && entry.attendee.user.avatar)
							entry.attendee.user.avatar = util.editURL(entry.attendee.user.avatar);


					});


					res.format({
						json: function() {
							res.send({
								status: 200,
								events: evs,
								total: total,
								skip: skip,
								pagename: "My Events"
							})
						}
					})
				});
			} else {
				res.format({
					json: function () {
						res.send({
							status: 404,
							message: "No Event Found"
						})

					}
				})
			}
			})
	})
}

exports.listNearEventsAPI = function (req, res) {
	
	/*console.log(req.query);
	console.log(req.params);
	console.log(req.params.lat);
	console.log(req.params.lng);
	console.log(req.body);*/

	var lat = parseFloat(req.params.lat)
		, lng = parseFloat(req.params.lng)
		, limit = parseInt(req.query.limit)
		, distance = req.query.distance
		, htmlIsEnabled = Boolean(req.query.html)
		, page = parseInt(req.query.page)


	


	if (!lat || !lng) {
		// render a blank page, and tell it to ask user for browser positioning
		console.log("stuck here");
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
		limit = 50;
	}
	
	var query = {
		'geo': {
			$near : [lng,lat], $maxDistance : 10/111.12 //10km radius
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

				if(events.length > 0){
					// May slow the app down.. Mongoose does not seem to support sub-document population (event.avatar)
					async.each(geos, function(geo, cb) {
						if (geo.event)
							geo.event.populate('avatar', cb);
						else
							cb(null)
					}, function(err) {
						events.forEach(function(entry) {
							if (entry.avatar && entry.avatar.url){
								if(entry.avatar.url == '/images/event-avatar-new2.svg') {
									entry.avatar.url ='/images/event_avatar_new.png';
								} else if(entry.avatar.url == '/images/event-avatar-new.svg') {
									entry.avatar.url ='/images/event_avatar_new.png';
								}
								entry.avatar.url = util.editURL(entry.avatar.url);
							}
						})
						res.format({
							json: function() {
								res.send({
									status: 200,
									events: events
								})
							}
						})
					})
				}else{
					res.format({
						json: function() {
							res.send({
								status: 404,
								messages: "No Event Found!"
							})
						}
					})
				}				
				
				
				
			}else{
				res.format({
					json: function() {
						res.send({
							status: 404,
							messages: "No Event Found!"
						})
					}
				})
			}
		}
	);
}

exports.allevents = function (req, res) {

	/*
	- Sortby
	- Lng,Lat
	- Limit

	*/
	console.log(req.body);
	var sortby = req.body.sortby;
	var longitude = req.body.longitude;
	var latitude = req.body.latitude;
	var limit = req.body.limit;

	var query = {
		start : { $gte: Date.now() },
		deleted: false,
		privateEvent: {
			$ne: true 
		}
	};
	
	if(sortby != ""){
		if(sortby == 1){
			sortquery = {"start" : -1};
		}else if(sortby == 2){
			sortquery = {"start" : 1};
		}else{
			sortquery = {"name" : 1};
		}
	}else{
		sortquery = {"start" : 1};
	}

	if(!limit){
		limit = 50;
	}
	
	if(longitude != "" && latitude != ""){

		var queryforgeo = {
			'geo': {
				$near : [longitude,latitude], $maxDistance : 10/111.12 //10km radius
			}
		};
		models.Geolocation.find(queryforgeo).populate({
			path: 'event',
			select: 'name start end address venue_name avatar source description',
			match: query
		}).limit(limit)
			.exec(function(err, geos) {
				if (err) throw err;
				
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
								res.send({
									status: 200,
									events: events

								})
							}
						})
					})
					
				}
			}
		);

	}else{

		models.Event.find(query)
			.populate('avatar')
			.select('name start end address venue_name avatar source description')
			.sort(sortquery)
			.limit(limit)
			.exec(function(err, evs) {
			if (err) throw err; 
			if (evs) {
				models.Event.find(query).count(function(err, total) {

					evs.forEach(function(entry) {
							
						if((entry.description) && entry.description != ''){

							//console.log(entry.description);
							entry.description = entry.description.replace(/(<([^>]+)>)/ig,"");
							entry.description = entry.description.substr(0, 350)+"...";
						}
						
					});

					res.format({
						json: function() {
							res.send({
								status: 200,
								events: evs
							})
						}
					});
				});
			}
		})
	}
}

exports.geteventcategories = function (req, res) {
	//var EventID = req.params.id;
	var Categories = null;

	//var query = {"_id": mongoose.Types.ObjectId(EventID)};
	//models.Event.findOne(query).populate("categories").exec(function (err, ev) {
	var query = {"_id": req.params.id};

	models.Event.find(query)
		//.lean()
		.exec(function (err, ev) {
			ev = ev[0];
			async.series([
				function (callback) {
					if (ev.categories != null) {
						Categories = ev.categories;
						callback(null);
					} else {
						callback(null);
					}
				}], function (err, results) {
				if (Categories) {
					res.format({
						json: function () {
							res.send({
								status: 200,
								categories: ev.categories
							})
						}
					});
				} else if (!event) {
					res.format({
						json: function () {
							res.send({
								staus: 404,
								messages: "No Event found"
							})
						}
					});
				} else {
					res.format({
						json: function () {
							res.send({
								staus: 404,
								messages: "No Category found"
							})
						}
					});
				}
			});

		});
}

//Takes Text input
exports.searchEvents = function (req, res) {
	var text = req.query.search;
	var temptext = text;
	var events;
	var paging = req.body.paging;

	query = searchQuery(text);
	//TODO: Fix Commented code to allow more deeper and better search by using async.queue
	models.Event.find().or(query).limit(50)
		.exec(function searchExact(err, ev) {

			if (!ev || ev.length == 0) {
				models.Event.find().or(searchQuery(text.split(/[ ,]+/)[0])).limit(50)
					.exec(function searchByWord(err, event) {

						if (!event || event.length == 0) {
							models.Event.find().or(searchQuery(text.charAt(0))).limit(50)
								.exec(function searchByWord(err, events) {
									sendEvents(res, events)
								})
						} else {
							sendEvents(res, event);
						}

					});
			} else {
				sendEvents(res, ev);
			}
		});

}


searchQuery = function (temptext) {
	temptext = new RegExp(temptext,'i');
	var query =
		[
			{"name": {$regex: temptext}},
			{"description": {$regex: temptext}},
			{"address": {$regex: temptext}},
			{"venue_name": {$regex: temptext}},
			{"categories": {$regex: temptext}}
		];

	return query;
}

sendEvents = function (res, ev) {
	res.format({
		json: function () {
			res.send({
				staus: 200,
				events: ev
			})
		}
	});
}
