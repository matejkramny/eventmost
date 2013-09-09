var auth = require('./auth'),
	everyauth = require('everyauth'),
	home = require('./home'),
	contact = require('./contact'),
	events = require('./events'),
	maps = require('./maps'),
	profile = require('./profile'),
	cards = require('./cards'),
	conversations = require('./conversations'),
	search = require('./search'),
	admin = require('./admin'),
	util = require('../util')

exports.router = function(app) {
	app.get('/', function(req, res) {
		if (res.locals.everyauth.loggedIn == true) {
			home.display(req, res);
		} else {
			auth.display(req, res)
		}
	})
		.get('/auth/finish', util.authorized, auth.checkFinished)
		.post('/auth/finish', util.authorized, auth.doCheckFinished)
		.get('/about', contact.about)
		.get('/contact', contact.contactus)
		.post('/contact', contact.doContact)
		.get('/token', getToken)
		.post('/auth/password.json', auth.doPasswordJSON)
		.get('/auth/twitter.json', auth.doTwitterJSON)
		.get('/auth/facebook.json', auth.doFacebookJSON)
		.get('/auth/linkedin.json', auth.doLinkedInJSON)
		.get('/logout.json', logoutJSON)
		.get('/loggedin', isloggedin);
	
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
	conversations.router(app)
	// search API
	search.router(app)
	
	// Administration
	admin.router(app)
}

function getToken (req, res) {
	res.send({
		token: req.csrfToken()
	});
}

function logoutJSON (req, res) {
	req.logout();
	res.send({
		success: true
	})
}

function isloggedin(req, res) {
	res.format({
		json: function() {
			var loggedIn = false;
			if (req.session.auth) {
				loggedIn = req.session.auth.loggedIn;
			}
			
			res.send({
				loggedIn: loggedIn,
			})
		}
	})
}