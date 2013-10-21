var fs = require('fs'),
	models = require('../models')
	, mongoose = require('mongoose')

exports.router = function (app) {
	app.get('/search/people/', searchPeople)
}

function searchPeople (req, res) {
	var q = req.query.q;
	
	if (!q) {
		q = "";
	}
	
	var split = q.split(' ');
	var query = {};
	
	if (split.length > 0 && split[0].length > 0) {
		query.name = new RegExp(split[0], 'i');
	}
	if (split.length > 1 && split[1].length > 0) {
		query.surname = new RegExp(split[1], 'i');
	}
	
	console.log(query)
	models.User.find(query).sort("-name-surname").exec(function(err, people) {
		if (err) throw err;
		
		res.locals.search = {
			query: q,
			results: people
		}
		res.render('search/results')
	});
}

function searchPerson (req, res) {
	var name = req.params.name;
	
	var split = name.split(' ');
	
	console.log(split)
	
	models.User.find({
		name: new RegExp(split[0], 'i'),
		surname: new RegExp(split[1], 'i')
	}).sort("-name-surname").exec(function(err, users) {
		if (err) throw err;
		console.log(users)
		res.send({
			users: users,
			user: req.user
		})
	})
}