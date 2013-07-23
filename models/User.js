var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	created: Date,
	incomplete: Boolean,
	email: String,
	password: String,
	name: String,
	surname: String,
	position: String,
	desc: String,
	company: String,
	location: String,
	website: String,
	education: String,
	interests: String,
	avatar: String,
	session_id: String,
	session_expiration: Date,
	facebook: {
		token: String,
		userid: String
	},
	twitter: {
		token: String,
		userid: Number
	},
	linkedin: {
		token: String,
		userid: String
	},
	github: {
		token: String,
		userid: String
	}
	new_mail: Number,
	new_cards: Number,
	device: {
		token: String
	},
	hash: String,
	hash_expiry: Date
});

scheme.statics.createWithTwitter = function(meta, accessToken, accessTokenSecret, cb) {
	console.log("Twitter meta: " + meta)
	
	var user = new exports.User({
		created: Date().now,
		incomplete: true,
		twitter: {
			token: accessToken,
			userid: meta.id
		},
		avatar: meta.profile_image_url,
		location: meta.location
	});
	
	user.save(function(err) {
		cb(err, user);
	});
}
scheme.statics.createWithGithub = function(meta, accessToken, accessTokenSecret, cb) {
	console.log("Github meta: " + meta)
	
	var user = new exports.User({
		created: Date().now,
		incomplete: true,
		github: {
			token: accessToken,
			userid: meta.id
		},
		avatar: meta.avatar_url,
		location: meta.location,
		email: meta.email
	})
	
	user.save(function(err) {
		cb(err, user)
	})
}
scheme.statics.createWithFacebook = function (meta, accessToken, accessTokenSecret, cb) {
	console.log("Facebook meta: " + meta)
	
	var user = new exports.User({
		created: Date().now,
		incomplete: true,
		facebook: {
			token: accessToken,
			userid: meta.id
		},
		location: meta.location,
		//untested idk whats in meta
	})
	
	user.save(function(err) {
		cb(err, user);
	})
}

exports.User = mongoose.model("User", scheme);