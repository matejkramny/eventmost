var fs = require('fs'),
	models = require('../models')
	, mongoose = require('mongoose')

exports.router = function (app) {
	app.get('/search/person/:name', searchPerson)
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