var fs = require('fs'),
	models = require('../../../models')
	, mongoose = require('mongoose')
	, util = require('../util')
	, moment = require('moment')
	, list = require('./apievent/apilist')

exports.router = function (app) {
	app.get('/api/search/', searchAPI)
}

exports.search = searchAPI;

function searchAPI (req, res) {
	
	console.log("/api/search/".red);
	var q = req.query.q;
	var type = req.query.type;
	
	console.log("q = ".red + req.query.q);
	console.log("type = ".red + req.query.type);
	
	if (!q) 
	{
		q = "";
	}
	
	if (!type || type != 'people') {
		type = 'events';
	}
	
	if (type == 'people') {
		searchPeople(req, res, q);
	} else {
		searchEvents(req, res, q);
	}
}

function searchEvents(req, res, q) 
{	
	var skip = 0;
	console.log("Searching Events ".red );
	console.log("req.query.arrange".red + req.query.arrange );
	
	if (req.query.arrange && req.query.arrange == 'nearby') {
		console.log("Arrange And Return . Dont Do Search".red);
		list.listEventsAPI(req, res);
		return;
	}

	var query = {
		name: new RegExp(q, 'i'),
		deleted: false,
		start: {
			$gte: new Date()
		}
	};
	
	models.Event.find(query).limit(10).populate('avatar').sort('start').exec(function(err, evs) {
		
		console.log("#############".red);
		//console.log(evs);
		console.log("#############".red);
		
		if (err) throw err; 
		if (evs) {
			models.Event.find(query).count(function(err, total) {
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

function searchPeople(req, res, q) {
	
	console.log("Searching People  = ".red );
	var skip = 0;
	console.log("req.query.arrange".red + req.query.arrange );

	var split = q.split(' ');
	var query = {
		isFeedbackProfile: false,
		disabled: false
	};
	
	if (split.length > 0 && split[0].length > 0) {
		query.name = new RegExp(split[0], 'i');
	}
	if (split.length > 1 && split[1].length > 0) {
		query.surname = new RegExp(split[1], 'i');
	}
	
	models.User.find(query).select('name surname desc avatar company position')
	.sort("-name-surname")
	.exec(function(err, people) {
		
		console.log("#############".red);
		console.log(people);
		console.log("#############".red);
		
		if (err) throw err; 
		if (people) {
			
				res.format({
					json: function() {
						res.send({
							users: people
						})
					}
				});
		}
	})
}
