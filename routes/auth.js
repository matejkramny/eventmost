var mongoose = require('mongoose')
	, everyauth = require('everyauth')
	, models = require('../models');

everyauth.everymodule.findUserById(function(id, cb) {
	console.log("Asking id "+id)
	models.User.findOne({ _id: mongoose.Schema.ObjectId(id) }, function(err, user) {
		cb(err, user);
	})
});
everyauth.twitter
	.entryPath('/auth/twitter')
	.callbackPath('/auth/twitter/callback')
	.consumerKey("nlvyUeSPdTPJZGvQzyeLg")
	.consumerSecret("mGAdYwq6NjUMInJk6EdhP5Gv5mGchuATkiMktxOGmI")
	.findOrCreateUser(function(session, accessToken, accessTokenSecret, twitterUserMetadata) {
		console.log(twitterUserMetadata.id)
		console.log(accessToken)
		
		var promise = this.Promise();
		
		models.User.findOne({
			'twitter.userid': twitterUserMetadata.id,
			'twitter.token': accessToken
		}, function(err, user) {
			if (err) promise.fulfill(err);
			
			if (user != null) {
				promise.fulfill(user);
			} else {
				// create user
				models.User.createWithTwitter(twitterUserMetadata, accessToken, accessTokenSecret, function(err, twUser) {
					promise.fulfill(twUser);
				});
			}
		});
		
		return promise;
	})
	.redirectPath('/auth/finish');

exports.display = function(req, res) {
	res.render('login');
}

exports.authenticateProvider = function(req, res) {
	
}

exports.doLogin = function(req, res) {
}
exports.doRegister = function(req, res) {
	
}