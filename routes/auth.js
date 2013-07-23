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

exports.doFinished = function (req, res) {
	
}


exports.authenticateProvider = function(req, res) {
	
}

exports.doLogin = function(req, res) {
}
exports.doRegister = function(req, res) {
	
}