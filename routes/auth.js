var mongoose = require('mongoose')
	, everyauth = require('everyauth')
	, models = require('../models');

// TODO after login with service X, allow to link the account to service XY
everyauth.everymodule.findUserById(function(id, cb) {
	console.log("Asking id "+id)
	models.User.findOne({ _id: mongoose.Types.ObjectId(id) }, function(err, user) {
		console.log("Returning "+user);
		cb(err, user);
	})
});
everyauth.password
	.getLoginPath('/auth')
	.postLoginPath('/auth/password')
	.loginView('login')
	.authenticate(function(login, password) {
		var promise = this.Promise();
		
		models.User.findOne({
			email: login
		}, function(err, user) {
			if (err) return promise.fulfill([err])
			
			if (user == null) {
				// register user
				models.User.createWithPassword(login, password, function(err, regUser) {
					promise.fulfill(user);
				});
			} else {
				// check if password is ok
				if (user.password == password) {
					promise.fulfill(user);
				} else {
					promise.fulfill(["Invalid password"]);
				}
			}
		})
		
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
		
		models.User.findOne({
			'twitter.userid': meta.id,
			'twitter.token': accessToken
		}, function(err, user) {
			if (err) promise.fulfill(err);
			
			if (user != null) {
				promise.fulfill(user);
			} else {
				// create user
				models.User.createWithTwitter(meta, accessToken, accessTokenSecret, function(err, twUser) {
					promise.fulfill(twUser);
				});
			}
		});
		
		return promise;
	})
	.redirectPath('/auth/finish');
everyauth.github
	.entryPath('/auth/github')
	.callbackPath('/auth/github/callback')
	.appId('81f5773eed44dee03218')
	.appSecret('84cb8f94ad6e8f50b71508d46fb120496c90e545')
	.scope("user:email")
	.findOrCreateUser(function(session, accessToken, accessTokenSecret, meta) {
		console.log(meta);
		
		var promise = this.Promise();
		
		models.User.findOne({
			'github.userid': meta.id,
			'github.token': accessToken
		}, function(err, user) {
			if (err) promise.fulfill(err);
			
			if (user != null) {
				promise.fulfill(user);
			} else {
				// create user
				models.User.createWithGithub(meta, accessToken, accessTokenSecret, function(err, ghUser) {
					promise.fulfill(ghUser);
				});
			}
		});
		
		return promise;
	})
	.redirectPath('/auth/finish');
everyauth.facebook
	.entryPath('/auth/facebook')
	.callbackPath('/auth/facebook/callback')
	.appId('532240236843933')
	.appSecret('61e367fbe3aae28d49c788229aaa4464')
	.findOrCreateUser(function(session, accessToken, accessSecret, meta) {
		console.log(meta);
		
		var promise = this.Promise();
		
		models.User.findOne({
			'facebook.userid': meta.id,
			'facebook.token': accessToken
		}, function(err, user) {
			if (err) promise.fulfill(err);
			
			if (user != null) {
				promise.fulfill(user);
			} else {
				// create user
				models.User.createWithFacebook(meta, accessToken, accessTokenSecret, function(err, fbUser) {
					promise.fulfill(fbUser);
				});
			}
		});
		
		return promise;
	})
	.redirectPath('/auth/finish')
everyauth.linkedin
	.entryPath('/auth/linkedin')
	.callbackPath('/auth/linkedin/callback')
	.consumerKey('rklpzzr92ztv')
	.consumerSecret('H0y6fL9dAa4WEhzd')
	.findOrCreateUser(function(session, accessToken, accessSecret, meta) {
		console.log(meta);
		
		var promise = this.Promise();
		
		models.User.findOne({
			'linkedin.userid': meta.id,
			'linkedin.token': accessToken
		}, function(err, user) {
			if (err) promise.fulfill(err);
			
			if (user != null) {
				promise.fulfill(user);
			} else {
				// create user
				models.User.createWithLinkedIn(meta, accessToken, accessTokenSecret, function(err, inUser) {
					promise.fulfill(inUser);
				});
			}
		});
		
		return promise;
	})
	.redirectPath('/auth/finish')

exports.display = function(req, res) {
	res.render('login');
}

exports.checkFinished = function (req, res) {
	if (req.user.incomplete == true) {
		res.render('finishreg');
	} else {
		res.redirect('/')
	}
}