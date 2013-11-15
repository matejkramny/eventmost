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

function removeEventCompletely (req, res, next) {
	models.Event.remove({ _id: req.params.id }, function(err) {
		if (!err) {
			res.redirect('/admin/events');
		}
		else {
			throw err;
		}
	});
}

function removeEvent (req, res, next) {
	models.Event.findById(req.params.id, function (err, event) {
		if (err) return handleError(err);
		
		event.deleted = true;
		event.save(function (err) {
			if (err) return handleError(err);
			res.send(event);
		});
	});
	
	res.redirect('/admin/events')
}

function OPUSER (req, res, next) {
	models.User.findById(req.params.id, function (err, user) {
		if (err) return handleError(err);
		
		user.admin = true;
		user.save(function (err) {
			if (err) return handleError(err);
			res.send(user);
		});
	});
	
	res.redirect('/admin/users')
}

function DEOPUSER (req, res, next) {
	models.User.findById(req.params.id, function (err, user) {
		if (err) return handleError(err);
		
		user.admin = false;
		user.save(function (err) {
			if (err) return handleError(err);
			res.send(user);
		});
	});
	res.redirect('/admin/users')
}

function hire (req, res, next) {
	models.User.findById(req.params.id, function (err, user) {
		if (err) return handleError(err);
		
		user.adminMeeting = true;
		user.save(function (err) {
			if (err) return handleError(err);
			res.send(user);
		});
	});
	res.redirect('/admin/users')
}

function fire (req, res, next) {
	models.User.findById(req.params.id, function (err, user) {
		if (err) return handleError(err);
		
		user.adminMeeting = false;
		user.save(function (err) {
			if (err) return handleError(err);
			res.send(user);
		});
	});
	res.redirect('/admin/users')
}

function reviveEvent (req, res, next) {
	models.Event.findById(req.params.id, function (err, event) {
		if (err) return handleError(err);
		
		event.deleted = false;
		event.save(function (err) {
			if (err) return handleError(err);
			res.send(event);
		});
	});
	
	res.redirect('/admin/events')
}

function removeUser (req, res, next) {
	models.User.remove({ _id: req.params.id }, function(err) {
		if (!err) {
			res.redirect('/admin/users');
		}
		else {
			throw err;
		}
	});
}

exports.router = function (app) {
	app.get('/admin', authorize, dashboard.show)
		.get('/admin/users', authorize, users.show)
		.get('/admin/emails', authorize, emails.show)
		.get('/admin/events', authorize, events.show)
		.get('/admin/events/:id/delete', authorize, removeEvent)
		.get('/admin/events/:id/remove', authorize, removeEventCompletely)
		.get('/admin/events/:id/revive', authorize, reviveEvent)
		.get('/admin/users/:id/remove', authorize, removeUser)
		.get('/admin/users/:id/op', authorize, OPUSER)
		.get('/admin/users/:id/deop', authorize, DEOPUSER)
		.get('/admin/users/:id/fire', authorize, fire)
		.get('/admin/users/:id/hire', authorize, hire)
}