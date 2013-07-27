var features = require('./features'),
	auth = require('./auth'),
	everyauth = require('everyauth'),
	home = require('./home'),
	contact = require('./contact'),
	events = require('./events'),
	maps = require('./maps')

exports.router = function(app) {
	app.get('/', function(req, res) {
		if (res.locals.everyauth.loggedIn == true) {
			home.display(req, res);
		} else {
			auth.display(req, res)
		}
	})
		.get('/auth/finish', auth.checkFinished)
		.get('/features', features.displayFeatures)
		.get('/about', contact.about)
		.get('/contact', contact.contactus)
	
	// Events..
	events.router(app);
	// Maps
	maps.router(app);
}