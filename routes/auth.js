var mongoose = require('mongoose')
	, everyauth = require('everyauth')
	, models = require('../models')
	, https = require('https')

everyauth.everymodule.findUserById(function(id, cb) {
	models.User.findOne({ _id: mongoose.Types.ObjectId(id) }, function(err, user) {
		cb(err, user);
	})
});
everyauth.password
	.getLoginPath('/auth')
	.postLoginPath('/auth/password')
	.loginView('login')
	.authenticate(function(login, password) {
		var promise = this.Promise();
		
		models.User.authenticatePassword(login, password, function(err, user) {
			if (err) promise.fulfill([err]);
			else promise.fulfill(user);
		});
				
		return promise;
	})
	.loginSuccessRedirect('/')
	.getRegisterPath('/auth')
	.postRegisterPath('/auth/password')
	.registerView('login')
	.validateRegistration(function(){})
	.registerUser(function(userAttrs) {})
	.registerSuccessRedirect('/')
	
everyauth.twitter
	.entryPath('/auth/twitter')
	.callbackPath('/auth/twitter/callback')
	.consumerKey("nlvyUeSPdTPJZGvQzyeLg")
	.consumerSecret("mGAdYwq6NjUMInJk6EdhP5Gv5mGchuATkiMktxOGmI")
	.findOrCreateUser(function(session, accessToken, accessTokenSecret, meta) {
		var promise = this.Promise();
		
		models.User.authenticateTwitter(session, accessToken, accessTokenSecret, meta, function(err, user) {
			if (err) promise.fulfill([err]);
			else promise.fulfill(user);
		});
		
		return promise;
	})
	.redirectPath('/auth/finish');

everyauth.facebook
	.entryPath('/auth/facebook')
	.callbackPath('/auth/facebook/callback')
	.scope('email')
	.appId('532240236843933')
	.appSecret('61e367fbe3aae28d49c788229aaa4464')
	.findOrCreateUser(function(session, accessToken, accessSecret, meta) {
		var promise = this.Promise();
		
		models.User.authenticateFacebook(session, accessToken, accessSecret, meta, function(err, user) {
			if (err) promise.fulfill([err])
			else promise.fulfill(user);
		})
		
		return promise;
	})
	.redirectPath('/auth/finish')

everyauth.linkedin
	.entryPath('/auth/linkedin')
	.callbackPath('/auth/linkedin/callback')
	.consumerKey('rklpzzr92ztv')
	.consumerSecret('H0y6fL9dAa4WEhzd')
	.findOrCreateUser(function(session, accessToken, accessSecret, meta) {
		var promise = this.Promise();
		
		models.User.authenticateLinkedIn(session, accessToken, accessSecret, meta, function(err, user) {
			if (err) promise.fulfill([err])
			else promise.fulfill(user)
		})
		
		return promise;
	})
	.redirectPath('/auth/finish')

exports.display = function(req, res) {
	res.render('login', { title: "Login" });
}

exports.checkFinished = function (req, res) {
	if (req.user.requestEmail == true) {
		req.user.requestEmail = false;
		req.user.save(function(err) {
			if (err) throw err;
			
			res.render('finishreg', { title: "Last step" });
		});
	} else {
		res.redirect('/')
	}
}
exports.doCheckFinished = function (req, res) {
	var email = req.body.email;
	
	if (email.length != 0) {
		req.user.email = email;
		req.user.save(function(err) {
			if (err) throw err;
		})
	}
	
	res.redirect('/')
}

exports.doPasswordJSON = function (req, res) {
	models.User.authenticatePassword(req.body.login, req.body.password, function(err, user) {
		if (err == null && user) {
			user.password = null;
			user.twitter = null;
			user.facebook = null;
			user.linkedin = null;
			
			req.session.auth = req.session.auth || {}
			req.session.auth.userId = user._id;
			req.session.auth.loggedIn = true;
			
			res.send({
				status: 200,
				user: user
			})
		} else {
			res.send({
				status: 404,
				message: "Bad password",
				err: err
			})
		}
	})
}
exports.doTwitterJSON = function (req, res) {
	
}
exports.doFacebookJSON = function (req, res) {
	var access_token = req.query.code;
	
	if (access_token) {
		https.request({
			host: 'graph.facebook.com',
			path: '/me?access_token='+access_token
		}, function(response) {
			var json = "";
			
			response.on('data', function(chunk) {
				json += chunk;
			});
			
			response.on('end', function() {
				console.log(json);
				var js = JSON.stringify(json);
				if (js.error != null) {
					// Error
					res.send({
						status: 403,
						message: "Facebook error"
					});
				} else {
					models.User.authenticateFacebook(req.session, access_token, "", js, function(err, user) {
						if (err) {
							res.send({
								status: 500,
								message: "Internal Server Error"
							});
							return;
						}
						
						res.send({
							status: 200,
							user: user
						})
					})
				}
			})
		}).end()
	}
}
exports.doLinkedInJSON = function (req, res) {
}

exports.router = function (app) {
	app.post('/login.json', doJSONLogin)
}
