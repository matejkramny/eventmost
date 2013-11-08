var auth = require('./auth'),
	home = require('./home'),
	contact = require('./contact'),
	events = require('./events'),
	maps = require('./maps'),
	profile = require('./profile'),
	cards = require('./cards'),
	inbox = require('./inbox'),
	search = require('./search'),
	admin = require('./admin'),
	util = require('../util'),
	models = require('../models')

exports.router = function(app) {
	app.get('/', function(req, res) {
		if (req.user) {
			home.display(req, res);
		} else {
			auth.display(req, res)
		}
	})
		.get('/about', contact.about)
		.get('/contact', contact.contactus)
		.post('/contact', contact.doContact)
		.get('/token', getToken)
		.get('/logout.json', logoutJSON)
		.get('/loggedin', isloggedin)
		.post('/emailavailable', emailAvailable)
		.get('/testroute*', testRoute)
	
	// Used for JSON/XML auth responses
	auth.router(app)
	// Events..
	events.router(app);
	// Maps
	maps.router(app);
	// profile
	profile.router(app);
	// business cards
	cards.router(app)
	// topics
	inbox.router(app)
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
			
			var user = null;
			if (loggedIn) {
				user = req.user;
				delete user.facebook, user.twitter, user.linkedin, user.password
			}
			
			res.send({
				loggedIn: loggedIn,
				user: user
			})
		}
	})
}

function emailAvailable(req, res) {
	models.User.find({
		email: req.body.email
	}, function(err, user) {
		if (err) throw err;
		
		var available = true;
		if (user != null && user.length > 0) {
			available = false;
		}
		
		res.format({
			json: function() {
				res.send({
					available: available
				})
			}
		})
	});
}

function testRoute (req, res) {
	res.render('testroute'+req.url);
}