var mongoose = require('mongoose')
	, passport = require('passport')
	, config = require('../../../config')
	, models = require('../../../models') 
	, util = require('../util')
	, LocalStrategy = require('passport-local').Strategy
	, TwitterStrategy = require('passport-twitter').Strategy
	, LinkedinStrategy = require('passport-linkedin').Strategy
	, FacebookStrategy = require('passport-facebook').Strategy;

passport.serializeUser(function(user, done) {
	done(null, user._id);
});

passport.deserializeUser(function(id, done) {
	models.User.findById(id).populate('savedProfiles').exec(function(err, user) {
		done(err, user);
	});
});

passport.use(new FacebookStrategy({
	clientID: config.credentials.social.fb.key,
	clientSecret: config.credentials.social.fb.secret,
	callbackURL: 'http://'+config.host+'/auth/facebook/callback'
}, models.User.authenticateFacebook));

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
			successRedirect: '/',
			failureRedirect: '/?fail-reason=Cannot Sign in With '+serviceName+' :(#login-failed)'
		};
	}
	app.post('/api/auth/password',doPasswordLogin)
		.post('/api/register', registerUser)
		.post('/api/auth/facebookMobile', facebookMobile)
		.post('/api/auth/twitterApp', twitterApp)
		.post('/api/auth/LinkedInApp', LinkedInApp)
		.post('/api/auth/password_reset', doPasswordReset)
		.get('/api/auth/password_reset/:id', findPasswordReset)
		.post('/api/auth/password_reset/:id', performPasswordReset)
		.post('/api/auth/changepassword', change_password)
		.get('/api/auth/facebook', saveSocialRedirect, passport.authenticate('facebook', { scope: 'email' }))
		.get('/api/auth/facebook/callback', passport.authenticate('facebook', socialRoute('Facebook')))
		.post('/api/auth/twitter', saveSocialRedirect, passport.authenticate('twitter'))
		.get('/api/auth/twitter/callback', passport.authenticate('twitter', socialRoute('Twitter')))
		.get('/api/auth/linkedin', saveSocialRedirect, passport.authenticate('linkedin', { scope: ['r_network', 'r_basicprofile', 'r_fullprofile', 'r_contactinfo', 'rw_nus', 'r_emailaddress'] }))
		.get('/api/auth/linkedin/callback', passport.authenticate('linkedin', socialRoute('LinkedIn')))
		.get('/api/auth/success', util.authorized, authSuccess) 
		.get('/api/auth/login/:uid', util.authorized, doLogin) 
		
		.get('/api/logout', logout);
};

exports.display = function(req, res) {
	search.search(req, res);
};

function saveSocialRedirect (req, res, next) {
	
	console.log("Save Social Redirect---------".red);
	console.log(req.body);
	try {
		req.session.socialRedirect = mongoose.Types.ObjectId(req.query.redirect);
	} catch (e) {
		req.session.socialRedirect = null;
	}
	
	next()
	
//	res.send({name:req.query.ridrect})
}

function facebookMobile(req, res){
	
	var email = req.body.email;
	var fb_id = req.body.fb_id;
	var name = req.body.name;

	models.User.findOne({
		"facebook": {"userid" : fb_id}
	}, function (err, user){

		if(user){
			res.format({
				json: function() {
					res.send({
						status: 200,
						user : user
					});
				}
			});
			return;
		}else{
			var newUser = {
				"email" : email,
				"name" : name,
					"facebook" : {
					"userid" : fb_id
				}
			}

			var newUser = new models.User(newUser);
			newUser.save();

			res.format({
				json: function() {
					res.send({
						status : 200,
						changeStatus : "OK",
						user : newUser
					});
				}
			});
			return;
		}
	});
}

function twitterApp(req, res){
	
	var email = req.body.email;
	var twitter = req.body.twitter_id;
	var name = req.body.displayname;

	models.User.findOne({
		"twitter": {"userid" : twitter}
	}, function (err, user){
	
		if(user){
			res.format({
				json: function() {
					res.send({
						status: 200,
						user : user
					});
				}
			});
			return;
		}else{
			var newUser = {
				"email" : email,
				"name" : name,
					"twitter" : {
					"userid" : twitter
				}
			}

			var newUser = new models.User(newUser);
			newUser.save();

			res.format({
				json: function() {
					res.send({
						status : 200,
						changeStatus : "OK",
						user : newUser
					});
				}
			});
			return;
		}
	});
}

function LinkedInApp(req, res){
	//console.log(req.body);
	var email = req.body.email;
	var linkedin = req.body.linkedin_id;
	var name = req.body.name;
	
	models.User.findOne({
		"linkedin":{"userid" : linkedin}
	}, function (err, user){
		console.log(user);
		if(user){
			res.format({
				json: function() {
					res.send({
						status: 200,
						user : user
					});
				}
			});
			return;
		}else{
			var newUser = {
				"email" : email,
				"name" : name,
				"linkedin" : {
					"userid" : linkedin
				}
				
			}

			var newUser = new models.User(newUser);
			newUser.save();

			res.format({
				json: function() {
					res.send({
						status : 200,
						changeStatus : "OK",
						user : newUser
					});
				}
			});
			return;
		}
	});
}


function registerUser(req, res){
	var email = req.body.login,
	password = req.body.password,
	name = req.body.name;
	
	try {
		if (!email || !password || !name) {
			throw Error();
		}
	}catch (e) {
		res.send({
			status: 404,
			message: "Missing Info",
			err: ["Please check if you have entered all information"]
		})
		return;
	}
	
	email = email.toLowerCase();

	models.User.findOne({
		email: email
	}, function(err, user) {
		if (err == null && user) {
			res.send({
				status: 404,
				err: ["This email is already Registered"]
			});
			
		}
		else
		{
			models.User.createWithPassword(email, password, function(err, user) {
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
							registerStatus: "OK",
							user: user
						});
				  	}
				});
			}); 
			
		} else {
			// auth fail
			res.format({
				json: function() {
					res.send({
						status: 404,
						message: "Error Registering",
						err: err
					})
				}
			})
			return;
		}
	}, {
		name: name
	});
		}
	})
	
	
}

function doPasswordLogin (req, res) {
	var email = req.body.login,
		password = req.body.password,
		name = req.body.name;
		
	try {
		if (!email || !password) {
			throw Error();
		}
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
				}
			})
			return;
		}
	}, {
		name: ""
	})
}

function doPasswordReset (req, res) {
	console.log(req.body);
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
			html: "<img src=\"http://eventmost.com/images/logo.svg\">\
	<br/><br/><p><strong>Hi "+user.getName()+",</strong><br/><br/>You have asked us to reset your password. To do that, click on the link below.<br/>\
	<a href='https://"+req.host+link+"'>Reset Your Password</a>\
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

function authSuccess (req, res) {
	if (req.session.socialRedirect) {
		var evid = req.session.socialRedirect;
		req.session.socialRedirect = null;
		
	//res.redirect('/event/'+evid+"/registrationpage?redirect=1");
		return;
	}
	
	if (req.session.redirectAfterLogin) {
		var redirect = req.session.redirectAfterLogin
		
		req.session.redirectAfterLogin = null;
		
		//res.redirect(redirect); 
		
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

function findPasswordReset (req, res) {
	var id = req.params.id;
	if (!id || id.length == 0) {
		res.format({
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
function change_password(req, res){

	var user_id = req.body._id;
	var email = req.body.email;
	var oldpassword = req.body.oldpassword;
	var newpassword = req.body.newpassword;
	var response = null;

	oldpassword = models.User.getHash(oldpassword);
	newpassword = models.User.getHash(newpassword);

	var query = {
		_id : mongoose.Types.ObjectId(user_id),
		email : email,
		password : oldpassword
	}

	models.User.findOne(query).exec(function (err, user){
		if (user) {

			models.User.update(query, {$set : {password: newpassword}}, function (err){
				user.password = newpassword;

				res.format({
					json: function() {
						res.send({
							status : 200,
							changeStatus : "OK",
							user : user
						});
					}
				});

				var options = {
					from: "EventMost <notifications@eventmost.com>",
					to: email+" <"+email+">",
					subject: "Password Change Notification",
					html: "<img src='http://dev.eventmost.com/images/logo.svg' />
			<br/><br/><p><strong>Hi ,</strong><br/><br/>Your password was changed at "+moment().format('DD/MM/YYYY HH:mm:ss')+".<br/>If you have not authorised this, please contact us <strong>IMMEDIATELY</strong> at <a href='mailto:support@eventmost.com'>support@eventmost.com</a>"
				}


				if (!config.transport_enabled) {
					console.log("Transport not enabled!")
					console.log(options);
					return;
				}

				
				config.transport.sendMail(options, function(err, response) {
					if (err) throw err;
			
					console.log("Email sent.."+response.message)
				});
				return;
			});
		}else{
			res.format({
				json: function() {
					res.send({
						status : 404,
						message : "Invalid Information",
						err : err
					});
				}
			});
			return;
		}
	});
}

