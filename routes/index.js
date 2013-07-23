var features = require('./features'),
	auth = require('./auth'),
	everyauth = require('everyauth')

exports.router = function(app) {
	app.get('/', features.displayFeatures)
		.get('/auth', auth.display)
		.get('/auth/finish', auth.checkFinished)
}