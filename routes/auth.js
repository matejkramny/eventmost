var mongoose = require('mongoose')
	, passport = require('passport')
	, models = require('../models')
	, https = require('https')

passport.serializeUser(function(user, done) {
	done(null, user._id);
});

passport.deserializeUser(function(id, done) {
	models.User.findById(id, function(err, user) {
		done(err, user)
	})
})

exports.router = function (app) {
	app.post('/auth/password', doPasswordLogin)
		.get('/logout', logout)
}

exports.display = function(req, res) {
	res.render('login', { title: "Login" });
}

function doPasswordLogin (req, res) {
	var email = req.body.email,
		password = req.body.password,
		name = req.body.name;
	
	models.User.authenticatePassword(email, password, function(err, user) {
		if (err == null && user) {
			// auth success
			req.login(user, function(err) {
				if (err) throw err;
				
				res.format({
					json: function() {
						user.password = null;
						user.twitter = null;
						user.facebook = null;
						user.linkedin = null;
					
						res.send({
							status: 200,
							user: user
						})
					},
					html: function() {
						res.redirect('/')
					}
				})
			});
		} else {
			// auth fail
			res.format({
				json: function() {
					res.send({
						status: 404,
						message: "Bad Login",
						err: err
					})
				},
				html: function() {
					res.redirect('/')
				}
			})
			return;
		}
	}, {
		name: name
	})
}

function logout (req, res) {
	req.logout();
	res.redirect('/')
}