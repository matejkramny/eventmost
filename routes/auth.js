var mongoose = require('mongoose')
	, passport = require('passport')
	, models = require('../models')
	, https = require('https')
	, FacebookStrategy = require('passport-facebook').Strategy
	, TwitterStrategy = require('passport-twitter').Strategy
	, LinkedinStrategy = require('passport-linkedin').Strategy
	, util = require('../util')
	, config = require('../config')
	, transport = config.transport
	, moment = require('moment')
	, check = require('validator').check
	, search = require('./search')

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
	callbackURL: 'http://'+config.host+'/auth/facebook/callback'
}, models.User.authenticateFacebook ));

passport.use(new TwitterStrategy({
	consumerKey: config.credentials.social.tw.key,
	consumerSecret: config.credentials.social.tw.secret,
	callbackURL: 'http://'+config.host+'/auth/twitter/callback'
}, models.User.authenticateTwitter))

passport.use(new LinkedinStrategy({
	consumerKey: config.credentials.social.linkedin.key,
	consumerSecret: config.credentials.social.linkedin.secret,
	callbackURL: 'http://'+config.host+'/auth/linkedin/callback',
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
		.post('/auth/password_reset', doPasswordReset)
		.get('/auth/password_reset/:id', findPasswordReset)
		.post('/auth/password_reset/:id', performPasswordReset)
		.get('/auth/facebook', saveSocialRedirect, passport.authenticate('facebook', { scope: 'email' }))
		.get('/auth/facebook/callback', passport.authenticate('facebook', socialRoute('Facebook')))
		.get('/auth/twitter', saveSocialRedirect, passport.authenticate('twitter'))
		.get('/auth/twitter/callback', passport.authenticate('twitter', socialRoute('Twitter')))
		.get('/auth/linkedin', saveSocialRedirect, passport.authenticate('linkedin', { scope: ['r_network', 'r_basicprofile', 'r_fullprofile', 'r_contactinfo', 'rw_nus', 'r_emailaddress'] }))
		.get('/auth/linkedin/callback', passport.authenticate('linkedin', socialRoute('LinkedIn')))
		
		.get('/auth/success', util.authorized, authSuccess)
		.get('/auth/login/:uid', util.authorized, doLogin)
		
		.get('/logout', logout)
}

exports.display = function(req, res) {
	search.search(req, res)
}

function saveSocialRedirect (req, res, next) {
	try {
		req.session.socialRedirect = mongoose.Types.ObjectId(req.query.redirect);
	} catch (e) {
		req.session.socialRedirect = null;
	}
	
	next()
}

function doPasswordLogin (req, res) {
	var email = req.body.login,
		password = req.body.password,
		name = req.body.name;
	
	try {
		if (!email || !password) {
			throw Error();
		}
		
		check(email).isEmail();
	} catch (e) {
		res.send({
			status: 404,
			message: "Bad Login",
			err: ["Invalid Credentials"]
		})
		
		return;
	}
	
	email = email.toLowerCase();
	
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

function doPasswordReset (req, res) {
	var email = req.body.email;
	if (!email) {
		res.send({
			status: 400,
			err: []
		})
		
		return;
	}
	
	email = email.toLowerCase();
	
	models.User.findOne({
		disabled: false,
		email: email
	}, function(err, user) {
		if (err || !user) {
			res.send({
				status: 404,
				err: ["If the email is registered, you will receive it shortly."]
			});
			
			return;
		}
		
		// Create new pwd reset request
		var pwdReset = new models.PasswordReset({
			user: user._id
		})
		pwdReset.generateHash();
		pwdReset.save();
		
		var link = "/auth/password_reset/"+pwdReset.hash;
		
		// TODO move this to the User model
		var options = {
			from: "EventMost <notifications@eventmost.com>",
			to: user.getName()+" <"+user.email+">",
			subject: "Password Reset Notification",
			html: "<img src=\"http://eventmost.com/images/logo.png\">\
	<br/><br/><p><strong>Hi "+user.getName()+",</strong><br/><br/>You have asked us to reset your password. To do that, click on the link below.<br/>\
	<a href='http://"+req.host+link+"'>Reset Your Password</a>\
	<br /><br />Note: If this wasn't you, discard this email. Link is valid for 2 hours.\
	</p><br/>\
	Please do not reply to this email, because we are super popular and probably won't have time to read it..."
		}
		if (!config.transport_enabled) {
			console.log("Transport not enabled!")
			console.log(options);
			
			res.send({
				status: 404,
				err: ["If the email is registered, you will receive it shortly."]
			});
			
			return;
		}
		
		transport.sendMail(options, function(err, response) {
			if (err) throw err;
		
			console.log("Email sent.."+response.message)
		})
	
		// Record that an email was sent
		var emailNotification = new models.EmailNotification({
			to: user._id,
			email: user.email,
			type: "PasswordReset"
		})
		emailNotification.save(function(err) {
			if (err) throw err;
		});
		
		res.send({
			status: 404,
			err: ["If the email is registered, you will receive it shortly."]
		});
	})
}

function findPasswordReset (req, res) {
	var id = req.params.id;
	if (!id || id.length == 0) {
		res.format({
			html: function() {
				res.redirect('/');
			},
			json: function() {
				send(404);
			}
		})
		return;
	}
	
	models.PasswordReset.findOne({
		hash: id,
		created: {
			$gt: new Date(Date.now() - 60 * 60 * 2 * 1000)
		},
		used: false
	}, function(err, reset) {
		if (err || !reset) {
			res.format({
				html: function() {
					res.redirect('/');
				},
				json: function() {
					send(404);
				}
			})
			return;
		}
		
		res.locals.pid = id;
		res.locals.message = "";
		res.render('passwordReset');
	})
}

function performPasswordReset (req, res) {
	var id = req.params.id;
	if (!id || id.length == 0) {
		res.send(404);
		return;
	}
	
	models.PasswordReset.findOne({
		hash: id,
		created: {
			$gt: new Date(Date.now() - 60 * 60 * 2 * 1000)
		},
		used: false
	}).populate('user').exec(function(err, reset) {
		if (err || !reset) {
			res.send(404);
			return;
		}
		
		var password = req.body.password;
		if (password && password.length > 5) {
			reset.user.setPassword(password);
			reset.user.save();
			reset.used = true;
			
			reset.save();
			res.redirect('/?fail-reason=Password Reset Successful#login-failed')
			
			// TODO move this to the User model
			var options = {
				from: "EventMost <notifications@eventmost.com>",
				to: reset.user.getName()+" <"+reset.user.email+">",
				subject: "Password Reset Notification",
				html: "<img src=\"http://eventmost.com/images/logo.svg\">\
		<br/><br/><p><strong>Hi "+reset.user.getName()+",</strong><br/><br/>Your password was reset at "+moment().format('DD/MM/YYYY HH:mm:ss')+".<br/>If you have not authorised this, please contact us <strong>IMMEDIATELY</strong> at <a href='mailto:support@eventmost.com'>support@eventmost.com</a>"
			}
			if (!config.transport_enabled) {
				console.log("Transport not enabled!")
				console.log(options);
				return;
			}
			
			transport.sendMail(options, function(err, response) {
				if (err) throw err;
		
				console.log("Email sent.."+response.message)
			})
	
			// Record that an email was sent
			var emailNotification = new models.EmailNotification({
				to: reset.user._id,
				email: reset.user.email,
				type: "PasswordResetPerformed"
			})
			emailNotification.save(function(err) {
				if (err) throw err;
			});
			
			return;
		}
		
		res.locals.message = "Please choose a longer password.";
		res.locals.pid = id;
		res.render('passwordReset');
	})
}

function authSuccess (req, res) {
	if (req.session.socialRedirect) {
		var evid = req.session.socialRedirect;
		req.session.socialRedirect = null;
		
		res.redirect('/event/'+evid+"/registrationpage/edit");
		return;
	}
	
	if (req.session.redirectAfterLogin) {
		var redirect = req.session.redirectAfterLogin
		console.log("redirect: "+redirect);
		
		req.session.redirectAfterLogin = null;
		
		res.redirect(redirect);
		
		return;
	}
	
	res.redirect('/')
}

function logout (req, res) {
	req.logout();
	req.session.destroy();
	res.redirect('/')
}

function completeLogin (req, res, uid) {
	models.User.findById(uid, function(err, user) {
		if (err || !user) {
			res.redirect('/');
			return;
		}
		
		req.session.loggedin_as_user = req.user._id;
		req.session.loggedin_as_user_referrer = req.get('referrer');
		req.session.loggedin_as_user_restrict = null;
		
		req.login(user, function(err) {
			res.redirect('/');
		})
	})
}

function doLogin (req, res) {
	if (req.params.uid == 'return' && typeof req.session.loggedin_as_user !== 'undefined') {
		// Return to my original profile.
		models.User.findById(req.session.loggedin_as_user, function(err, user) {
			if (err || !user) {
				res.redirect('back');
				return;
			}
			
			req.login(user, function(err) {
				var referrer = req.session.loggedin_as_user_referrer;
				console.log("This referrer:"+referrer);
				delete req.session.loggedin_as_user;
				delete req.session.loggedin_as_user_referrer;
				delete req.session.loggedin_as_user_restrict;
				delete req.session.loggedin_as_user_redirect_restricted;
				delete req.session.loggedin_as_user_locals;
				
				res.redirect(referrer);
			});
		});
		
		return;
	}
	
	// admins can do loads of stuff..
	if (!req.user.admin) {
		res.redirect('back');
		return;
	}
	
	var uid = req.params.uid;
	try {
		uid = mongoose.Types.ObjectId(uid)
	} catch (e) {
		res.redirect('back');
		return;
	}
	
	return completeLogin(req, res, uid);
}