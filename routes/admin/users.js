var models = require('../../models')

exports.router = function (app) {
	app.get('/admin/users', show)
		.post('/admin/users/:id/remove', removeUser)
		.post('/admin/users/:id/op', getUser, OPUSER)
		.post('/admin/users/:id/deop', getUser, DEOPUSER)
}

function show (req, res) {
	res.format({
		html: function() {
			res.locals.activePage = 2
			res.render('admin/users', { layout: 'admin/layout' });
		},
		json: function() {
			models.User.find({}).sort('-created').exec(function(err, users) {
				if (err) throw err;
		
				res.send({
					users: users
				})
			})
		}
	})
}

function getUser (req, res, next) {
	models.User.findById(req.params.id, function (err, user) {
		if (err) throw err;
		
		if (user) {
			res.locals._user = user;
			next()
		} else {
			res.format({
				html: function() {
					res.redirect('/admin')
				},
				json: function() {
					res.send(404, {})
				}
			})
		}
	});
}

function OPUSER (req, res) {
	var user = res.locals._user;
	
	user.admin = true;
	user.save(function (err) {
		if (err) throw err;
	});
	
	res.format({
		html: function() {
			res.redirect('/admin/users')
		},
		json: function() {
			res.send(200, {});
		}
	})
}

function DEOPUSER (req, res) {
	var user = res.locals._user;
	
	user.admin = false;
	user.save(function (err) {
		if (err) throw err;
	});
	
	res.format({
		html: function() {
			res.redirect('/admin/users')
		},
		json: function() {
			res.send(200, {});
		}
	})
}

function removeUser (req, res) {
	models.User.findById(req.params.id, function(err, user) {
		if (err) throw err;
		
		user.disabled = true;
		user.save();
		
		res.format({
			html: function() {
				res.redirect('/admin/users')
			},
			json: function() {
				res.send(200, {})
			}
		})
	});
}