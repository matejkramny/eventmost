var mongoose = require('mongoose')
	,crypto = require('crypto')

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	created: {
		type: Date,
		default: Date.now
	},
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
	},
	new_mail: Number,
	new_cards: Number,
	device: {
		token: String
	},
	hash: String,
	hash_expiry: Date
});

scheme.methods.setName = function (name) {
	var split = name.split(' ');
	this.name = split[0];
	this.surname = split[split.length -1];
}
scheme.methods.getName = function () {
	var name;
	
	if ((this.name != null && this.name.length != 0) || (this.surname != null && this.surname.length != 0)) {
		name = this.name + " " + this.surname;
	} else {
		name = this.email;
	}
	
	return name;
}

scheme.methods.setPassword = function(password) {
	var shasum = crypto.createHash('sha1');
	this.password = shasum.update("aßas155"+password+"90124*)SADZ~<").digest('hex');
}

scheme.statics.getHash = function (password) {
	var shasum = crypto.createHash('sha1');
	return shasum.update("aßas155"+password+"90124*)SADZ~<").digest('hex');
}

scheme.statics.createWithPassword = function (login, password, cb) {
	console.log("Registering with login/password");
	
	var user = new exports.User({
		email: login,
		password: password,
		incomplete: true
	});
	
	user.save(function(err) {
		cb(err, user);
	})
}

scheme.statics.createWithTwitter = function(meta, accessToken, accessTokenSecret, cb) {
	console.log("Twitter meta: " + meta)
	
	var user = new exports.User({
		incomplete: true,
		twitter: {
			token: accessToken,
			userid: meta.id
		},
		avatar: meta.profile_image_url,
		location: meta.location
	});
	user.setName(meta.name);
	
	user.save(function(err) {
		cb(err, user);
	});
}
scheme.statics.createWithGithub = function(meta, accessToken, accessTokenSecret, cb) {
	console.log("Github meta: " + meta)
	
	var user = new exports.User({
		incomplete: true,
		github: {
			token: accessToken,
			userid: meta.id
		},
		avatar: meta.avatar_url,
		location: meta.location,
		email: meta.email
	});
	user.setName(meta.name)
	
	user.save(function(err) {
		cb(err, user)
	})
}
scheme.statics.createWithFacebook = function (meta, accessToken, accessTokenSecret, cb) {
	console.log("Facebook meta: " + meta)
	
	var user = new exports.User({
		incomplete: true,
		facebook: {
			token: accessToken,
			userid: meta.id
		},
		location: meta.location,
		//untested idk whats in meta
	})
	user.setName(meta.name);
	
	user.save(function(err) {
		cb(err, user);
	})
}
scheme.statics.createWithLinkedIn = function (meta, accessToken, accessTokenSecret, cb) {
	console.log("Facebook meta: " + meta)
	
	var user = new exports.User({
		incomplete: true,
		facebook: {
			token: accessToken,
			userid: meta.id
		},
		location: meta.location,
		//untested idk whats in meta
	})
	user.setName(meta.name);
	
	user.save(function(err) {
		cb(err, user);
	})
}


exports.User = mongoose.model("User", scheme);