var fs = require('fs'),
	models = require('../models')
	, mongoose = require('mongoose')
	, util = require('../util')

exports.router = function (app) {
	app.get('/search/people/', util.authorized, searchPeople)
}

//TODO remove sensitive fields (password?) from the results
function searchPeople (req, res) {
	var q = req.query.q;
	
	if (!q) {
		q = "";
	}
	
	var split = q.split(' ');
	var query = {
		isFeedbackProfile: false
	};
	
	if (split.length > 0 && split[0].length > 0) {
		query.name = new RegExp(split[0], 'i');
	}
	if (split.length > 1 && split[1].length > 0) {
		query.surname = new RegExp(split[1], 'i');
	}
	
	models.User.find(query).sort("-name-surname").exec(function(err, people) {
		if (err) throw err;
		
		res.format({
			json: function() {
				var ppl = [];
				for (var i = 0; i < people.length; i++) {
					var person = people[i];
					
					ppl.push({
						_id: person._id,
						fullName: person.getName(),
						name: person.name,
						surname: person.surname,
						avatar: person.avatar.length > 0 ? person.avatar : "/images/default_speaker.svg",
						desc: person.desc,
						education: person.education,
						website: person.website,
						position: person.position,
						company: person.company,
						location: person.location
					})
				}
				
				res.send({
					query: q,
					results: ppl
				})
			},
			html: function() {
				res.locals.search = {
					query: q,
					results: people
				}
				
				res.render('search/results')
			}
		})
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