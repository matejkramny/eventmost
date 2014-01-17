var mongoose = require('mongoose')
	, passport = require('passport')
	, models = require('../models')
	, https = require('https')
	, FacebookStrategy = require('passport-facebook').Strategy
	, TwitterStrategy = require('passport-twitter').Strategy
	, LinkedinStrategy = require('passport-linkedin').Strategy
	, util = require('../util')
	, config = require('../config')

passport.serializeUser(function(user, done) {
	done(null, user._id);
});

passport.deserializeUser(function(id, done) {
	models.User.findById(id).populate('savedProfiles').exec(function(err, user) {
		done(err, user)
	})
})

passport.use(new FacebookStrategy({
	clientID: config.credentials.social.fb.key,
	clientSecret: config.credentials.social.fb.secret,
	callbackURL: 'http://eventmost.com/auth/facebook/callback'
}, models.User.authenticateFacebook ));

passport.use(new TwitterStrategy({
	consumerKey: config.credentials.social.tw.key,
	consumerSecret: config.credentials.social.tw.secret,
	callbackURL: 'http://eventmost.com/auth/twitter/callback'
}, models.User.authenticateTwitter))

passport.use(new LinkedinStrategy({
	consumerKey: config.credentials.social.linkedin.key,
	consumerSecret: config.credentials.social.linkedin.secret,
	callbackURL: 'http://eventmost.com/auth/linkedin/callback',
	profileFields: ['id', 'first-name', 'picture-url', 'last-name', 'email-address', 'location', 'publicProfileUrl', 'industry', 'headline', 'summary']
}, models.User.authenticateLinkedIn));

exports.router = function (app) {
	function socialRoute(serviceName) {
		return {
			successRedirect: '/auth/success',
			failureRedirect: '/?fail-reason=Cannot Sign in With '+serviceName+' :(#login-failed'
		}
	}
	
	app.post('/auth/password', doPasswordLogin)
		.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }))
		.get('/auth/facebook/callback', passport.authenticate('facebook', socialRoute('Facebook')))
		.get('/auth/twitter', passport.authenticate('twitter'))
		.get('/auth/twitter/callback', passport.authenticate('twitter', socialRoute('Twitter')))
		.get('/auth/linkedin', passport.authenticate('linkedin', { scope: ['r_network', 'r_basicprofile', 'r_fullprofile', 'r_contactinfo', 'rw_nus', 'r_emailaddress'] }))
		.get('/auth/linkedin/callback', passport.authenticate('linkedin', socialRoute('LinkedIn')))
		
		.get('/auth/success', util.authorized, authSuccess)
		
		.get('/logout', logout)
}

exports.display = function(req, res) {
	res.render('login', { title: "Login" });
}

function doPasswordLogin (req, res) {
	var email = req.body.login,
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
						res.redirect('/auth/success')
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
					res.redirect('/?fail-reason=Email or Password is incorrect :(#login-failed')
				}
			})
			return;
		}
	}, {
		name: name
	})
}

function authSuccess (req, res) {
	if (req.session.redirectAfterLogin) {
		var redirect = req.session.redirectAfterLogin
		
		req.session.redirectAfterLogin = null;
		
		res.redirect(redirect);
		
		return;
	}
	
	res.redirect('/')
}

function logout (req, res) {
	req.logout();
	res.redirect('/')
}