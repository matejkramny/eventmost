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

function removeEvent (req, res, next) {
	models.Event.findById(req.params.id, function (err, ev) {
		console.log(ev)})
	event.deleted = true
	event.save()
	res.redirect('/admin/events')
}

function reviveEvent (req, res, next) {
	models.Event.findById(req.params.id)
	event.deleted = false
	event.save()
}

function removeUser (req, res, next) {
	models.User.remove({ _id: req.params.id })
}

function returnToEvents (req, res) {
	window.location.href='/admin/events'
}

function returnToUsers (req, res) {
	window.location.href='/admin/users'
}

exports.router = function (app) {
	app.get('/admin', authorize, dashboard.show)
	app.get('/admin/users', authorize, users.show)
	app.get('/admin/emails', authorize, emails.show);
	app.get('/admin/events', authorize, events.show)
	app.get('/admin/events/:id/delete', authorize, removeEvent, returnToEvents)
	app.get('/admin/events/:id/revive', authorize, reviveEvent, returnToEvents)
	app.get('/admin/users/:id/remove', authorize, removeUser, returnToUsers)
}