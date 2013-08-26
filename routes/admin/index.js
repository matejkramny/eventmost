var users = require('./users')
	, models = require('../../models')
	, emails = require('./emails')
	, events = require('./events')
	, dashboard = require('./dashboard')

function authorize (req, res, next) {
	if (req.loggedIn && req.user.admin === true) {
		next()
	} else {
		res.redirect('/')
	}
}

exports.router = function (app) {
	app.get('/admin', authorize, dashboard.show)
	app.get('/admin/users', authorize, users.show)
	app.get('/admin/emails', authorize, emails.show);
	app.get('/admin/events', authorize, events.show)
}