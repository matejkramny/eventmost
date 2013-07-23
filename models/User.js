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

scheme.statics.createWithTwitter = function(twitterUserMetadata, accessToken, accessTokenSecret, cb) {
	var user = new exports.User({
		created: Date().now,
		incomplete: true,
		twitter: {
			token: accessToken,
			userid: twitterUserMetadata.id
		},
		avatar: twitterUserMetadata.profile_image_url,
		location: twitterUserMetadata.location
	});
	
	user.save();
	cb(null, user);
}

exports.User = mongoose.model("User", scheme);