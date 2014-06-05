var auth = require('./apiauth')
	models = require('../../../models'),
	//profile = require('./apiprofileService'),
	events = require('./apievents'),
	inbox = require('./apiinbox'),
	config = require('../../../config'),
	search = require('./apisearch');

// HTTP router
exports.router = function(app) {
	
	app.get('/api/token', getToken)// Used in the mobile apps
		.get('/api/logout', logoutJSON)
		.get('/api/loggedin', isloggedin)
		.post('/api/emailavailable', emailAvailable)
	
	// Used for JSON/XML auth responses
	auth.router(app);
	//profile.router(app);
	inbox.router(app);
	search.router(app);
	events.router(app);
}

// WS router
exports.socket = function (socket) {
	events.socket(socket)
	inbox.socket(socket)
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

function render404 (req, res) {
	res.render('404', { title: "Not Found" })
}
function render500 (req, res) {
	res.render('500', { title: "Server Error" })
}