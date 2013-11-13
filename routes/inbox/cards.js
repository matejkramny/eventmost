var fs = require('fs')
	, models = require('../../models')
	, mongoose = require('mongoose')
	, util = require('../../util')
	, async = require('async')
	, transport = require('../../app').transport

exports.router = function (app) {
	app.get('/inbox/cards', showCards)
}

function showCards (req, res) {
	req.user.populate('receivedCards.card receivedCards.from', function(err) {
		if (err) throw err;
		
		res.render('inbox/business', { pageName: "Received Business Cards", title: "Private Messages" })
	})
}