var users = require('./users'),
	models = require('../../models'),
	emails = require('./emails'),
	events = require('./events'),
	dashboard = require('./dashboard')

function authorize (req, res, next) {
	if (req.user && req.user.admin === true) {
		next()
	} else {
		res.redirect('/')
	}
}

exports.router = function (app) {
	app.all('/admin', authorize)
		.all('/admin/*', authorize)
		
	dashboard.router(app)
	events.router(app)
	emails.router(app)
	users.router(app)
}