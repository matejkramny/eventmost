var features = require('./features'),
	auth = require('./auth'),
	everyauth = require('everyauth'),
	home = require('./home'),
	contact = require('./contact'),
	events = require('./events')

exports.router = function(app) {
	app.get('/', function(req, res) {
		console.log(req.session);
		if (res.locals.everyauth.loggedIn == true) {
			home.display(req, res);
		} else {
			features.displayFeatures(req, res);
		}
	})
		.get('/auth/finish', auth.checkFinished)
		.get('/features', features.displayFeatures)
		.get('/about', contact.about)
		.get('/contact', contact.contactus)
	
	
	// Events..
	events.router(app);
}