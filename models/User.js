var mongoose = require('mongoose')
	,crypto = require('crypto')

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	created: {
		type: Date,
		default: Date.now
	},
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
	avatar: { type: String, default: "/img/avatar.jpg" },
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
	savedProfiles: [
		{
			type: ObjectId,
			ref: 'User'
		}
	],
	requestEmail: { type: Boolean, default: false },
	admin: { type: Boolean, default: false }
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

scheme.methods.updateTwitter = function(meta, accessToken, accessTokenSecret, cb) {
	this.twitter = {
		token: accessToken,
		userid: meta.id
	};
	
	this.save(function(err) {
		cb(this)
	})
}
scheme.methods.updateFacebook = function(meta, accessToken, accessTokenSecret, cb) {
	this.facebook = {
		token: accessToken,
		userid: meta.id
	};
	
	this.save(function(err) {
		cb(this)
	})
}
scheme.methods.updateLinkedIn = function(meta, accessToken, accessTokenSecret, cb) {
	this.linkedin = {
		token: accessToken,
		userid: meta.id
	};
	
	this.save(function(err) {
		cb(this)
	})
}

scheme.methods.setPassword = function(password) {
	var shasum = crypto.createHash('sha1');
	this.password = shasum.update("aßas155"+password+"90124*)SADZ~<").digest('hex');
}

scheme.statics.getHash = function (password) {
	var shasum = crypto.createHash('sha1');
	return shasum.update("aßas155"+password+"90124*)SADZ~<").digest('hex');
}

scheme.statics.authenticatePassword = function (email, password, cb) {
	exports.User.findOne({
		email: email
	}, function(err, user) {
		if (err) throw err;
		
		if (user == null) {
			// register user
			exports.User.createWithPassword(email, password, function(err, regUser) {
				cb(null, regUser);
			});
		} else {
			// check if password is ok
			if (user.password == exports.User.getHash(password)) {
				cb(null, user);
			} else {
				cb(["Invalid password"]);
			}
		}
	})
}
scheme.statics.authenticateTwitter = function (session, accessToken, accessTokenSecret, meta, cb) {
	var query = {
		'twitter.userid': meta.id,
		'twitter.token': accessToken
	}
	
	models.User.find(query, function(err, users) {
		if (err) throw err;
		
		if (users.length > 0) {
			if (users.length > 1 || session.auth.loggedIn == true) {
				return cb(["Twitter account already linked"])
			}
			
			cb(null, users[0])
		} else {
			if (session.auth.loggedIn == true) {
				// Update the user's twitter token
				user.updateTwitter(meta, accessToken, accessTokenSecret, function(err) {
					cb(null, user);
				})
			} else {
				// Create user
				models.User.createWithTwitter(meta, accessToken, accessTokenSecret, function(err, twUser) {
					cb(null, twUser);
				});
			}
		}
	});
}
scheme.statics.authenticateFacebook = function (session, accessToken, accessSecret, meta, cb) {
	var query = {
		'facebook.userid': meta.id,
		'facebook.token': accessToken
	}
	
	models.User.find(query, function(err, users) {
		if (err) throw err;
		
		if (users.length > 0) {
			if (users.length > 1 || session.auth.loggedIn == true) {
				return cb(["Facebook account already linked"])
			}
			
			cb(null, users[0])
		} else {
			if (session.auth.loggedIn == true) {
				// Update the user's twitter token
				user.updateFacebook(meta, accessToken, accessTokenSecret, function(err) {
					cb(null, user);
				})
			} else {
				// Create user
				models.User.createWithFacebook(meta, accessToken, accessTokenSecret, function(err, aUser) {
					cb(null, aUser);
				});
			}
		}
	});
}
scheme.statics.authenticateLinkedIn = function (session, accessToken, accessSecret, meta, cb) {
	var query = {
		'linkedin.userid': meta.id,
		'linkedin.token': accessToken
	}
	
	models.User.find(query, function(err, users) {
		if (err) throw err;
		
		if (users.length > 0) {
			if (users.length > 1 || session.auth.loggedIn == true) {
				return cb(["LinkedIn account already linked"])
			}
			
			cb(null, users[0])
		} else {
			if (session.auth.loggedIn == true) {
				// Update the user's twitter token
				user.updateLinkedIn(meta, accessToken, accessTokenSecret, function(err) {
					cb(null, user);
				})
			} else {
				// Create user
				models.User.createWithLinkedIn(meta, accessToken, accessTokenSecret, function(err, aUser) {
					cb(null, aUser);
				});
			}
		}
	});
}

scheme.statics.createWithPassword = function (login, password, cb) {
	console.log("Registering with login/password");
	
	var user = new exports.User({
		email: login
	});
	user.setPassword(password)
	
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
		location: meta.location,
		requestEmail: true
	});
	user.setName(meta.name);
	
	user.save(function(err) {
		cb(err, user);
	});
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
		requestEmail: true
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
		linkedin: {
			token: accessToken,
			userid: meta.id
		},
		location: meta.location,
		requestEmail: true
		//untested idk whats in meta
	})
	user.setName(meta.name);
	
	user.save(function(err) {
		cb(err, user);
	})
}

exports.User = mongoose.model("User", scheme);