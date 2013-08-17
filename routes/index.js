var auth = require('./auth'),
	everyauth = require('everyauth'),
	home = require('./home'),
	contact = require('./contact'),
	events = require('./events'),
	maps = require('./maps'),
	profile = require('./profile'),
	cards = require('./cards'),
	topics = require('./topics'),
	search = require('./search')

exports.router = function(app) {
	app.get('/', function(req, res) {
		if (res.locals.everyauth.loggedIn == true) {
			home.display(req, res);
		} else {
			auth.display(req, res)
		}
	})
		.get('/auth/finish', auth.checkFinished)
		.get('/about', contact.about)
		.get('/contact', contact.contactus)
		.post('/contact', contact.doContact)
	
	// Used for JSON/XML auth responses
	//auth.router(app)
	// Events..
	events.router(app);
	// Maps
	maps.router(app);
	// profile
	profile.router(app);
	// business cards
	cards.router(app)
	// topics
	topics.router(app)
	// search API
	search.router(app)
}