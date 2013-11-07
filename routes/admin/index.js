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
	    res.send(evemt);
	  });
	});
	res.redirect('/admin/events')
}

function reviveEvent (req, res, next) {
	models.Event.findById(req.params.id, function (err, event) {
	  if (err) return handleError(err);
	  
	  event.deleted = false;
	 event.save(function (err) {
	    if (err) return handleError(err);
	    res.send(evemt);
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
	app.get('/admin/users', authorize, users.show)
	app.get('/admin/emails', authorize, emails.show);
	app.get('/admin/events', authorize, events.show)
	app.get('/admin/events/:id/delete', authorize, removeEvent)
	app.get('/admin/events/:id/remove', authorize, removeEventCompletely)
	app.get('/admin/events/:id/revive', authorize, reviveEvent)
	app.get('/admin/users/:id/remove', authorize, removeUser)
}