var fs = require('fs'),
	models = require('../models')
	, mongoose = require('mongoose')
	, util = require('../util')
	, moment = require('moment')
	, list = require('./event/list')

exports.router = function (app) {
	app.get('/search/', search)
}

exports.search = search;
function search (req, res) {
	var q = req.query.q;
	var type = req.query.type;
	
	if (!q) {
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

function searchEvents(req, res, q) {
	if (req.query.arrange && req.query.arrange == 'nearby') {
		list.listNearEvents(req, res);
		return;
	}else{
		list.listNearLandingEvents(req, res);
		return;
	}
	
	/*------------------------ Start Normal Events ----------------------- */
	/*var query = {
		name: new RegExp(q, 'i'),
		deleted: false,
		start: {
			$gte: new Date()
		}
	};
	
	models.Event.find(query).limit(10).populate('avatar').sort('start').exec(function(err, evs) {
		
		//Cleaning up the description...

		evs.forEach(function(entry) {
			
			if(entry.description != ''){
				entry.description = entry.description.replace(/(<([^>]+)>)/ig,"");
				entry.description = entry.description.substr(0, 200)+"...";

			}
		});
		
		res.locals.search = {
			query: q,
			results: evs,
			type: 'events'
		}
		res.locals.moment = moment;
		
		if (req.user) {
			res.render('search/results')
		} else {
			res.render('login')
		}
	})
	*/
	/*------------------------ End Normal Events ----------------------- */
}

function searchPeople(req, res, q) {
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
	
	models.User.find(query).select('name surname desc avatar company position').sort("-name-surname").exec(function(err, people) {
		if (err) throw err;
		
		res.locals.search = {
			query: q,
			results: people,
			type: 'people'
		}
		
		if (req.user) {
			res.format({
				html: function() {
					res.render('search/results')
				},
				json: function() {
					res.send({
						results: people
					})
				}
			})
		} else {
			res.render('login')
		}
	});
}
