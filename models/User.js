var mongoose = require('mongoose')
	,crypto = require('crypto')
	,https = require('https')

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	created: {
		type: Date,
		default: Date.now
	},
	email: String,
	password: String,
	name: { type: String, default: "" },
	surname: { type: String, default: "" },
	position: { type: String, default: "" },
	desc: { type: String, default: "" },
	company: { type: String, default: "" },
	location: { type: String, default: "" },
	website: { type: String, default: "" },
	education: { type: String, default: "" },
	interests: { type: String, default: "" },
	avatar: { type: String, default: "/img/avatar.jpg" },
	facebook: {
		userid: String
	},
	twitter: {
		userid: Number
	},
	linkedin: {
		userid: String
	},
	savedProfiles: [
		{
			type: ObjectId,
			ref: 'User'
		}
	],
	requestEmail: { type: Boolean, default: false },
	admin: { type: Boolean, default: false },
	mailboxUnread: { type: Number, default: 0 }
});

scheme.methods.setName = function (name) {
	try {
		var split = name.split(' ');
		this.name = split[0];
		if (split.length > 1) {
			this.surname = split[split.length -1];
		} else {
			this.surname = "";
		}
	} catch (exception) {
		// TODO log this exception
	}
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
		userid: meta.id
	};
	
	this.save(function(err) {
		cb(this)
	})
}
scheme.methods.updateFacebook = function(meta, accessToken, accessTokenSecret, cb) {
	this.facebook = {
		userid: meta.id
	};
	
	this.save(function(err) {
		cb(this)
	})
}
scheme.methods.updateLinkedIn = function(meta, accessToken, accessTokenSecret, cb) {
	this.linkedin = {
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

scheme.statics.authenticatePassword = function (email, password, cb, extra) {
	exports.User.findOne({
		email: email
	}, function(err, user) {
		if (err) throw err;
		
		if (user == null) {
			// register user
			exports.User.createWithPassword(email, password, function(err, regUser) {
				cb(null, regUser);
			}, extra);
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
		'twitter.userid': meta.id
	}
	
	models.User.find(query, function(err, users) {
		if (err) throw err;
		
		if (users.length > 0) {
			if (users.length > 1 || (session.auth && session.auth.loggedIn == true)) {
				return cb(["Twitter account already linked"])
			}
			
			cb(null, users[0])
		} else {
			if (session.auth && session.auth.loggedIn == true) {
				// Update the user's twitter token
				models.User.findOne({
					_id: mongoose.Types.ObjectId(session.auth.userId)
				}, function(err, user) {
					if (err) throw err;
					
					user.updateTwitter(meta, accessToken, accessTokenSecret, function(err) {
						cb(null, user);
					})
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
		'facebook.userid': meta.id
	}
	
	models.User.find(query, function(err, users) {
		if (err) throw err;
		
		if (users.length > 0) {
			if (users.length > 1 || (session.auth && session.auth.loggedIn == true)) {
				console.log("Already linked")
				return cb(["Facebook account already linked"])
			}
			
			cb(null, users[0])
		} else {
			if (session.auth && session.auth.loggedIn == true) {
				// Update the user's facebook token
				models.User.findOne({
					_id: mongoose.Types.ObjectId(session.auth.userId)
				}, function(err, user) {
					if (err) throw err;
					
					user.updateFacebook(meta, accessToken, accessSecret, function(err) {
						cb(null, user);
					})
				})
			} else {
				// Create user
				models.User.createWithFacebook(meta, accessToken, accessSecret, function(err, aUser) {
					cb(null, aUser);
				});
			}
		}
	});
}
scheme.statics.authenticateLinkedIn = function (session, accessToken, accessSecret, meta, cb) {
	var query = {
		'linkedin.userid': meta.id
	}
	
	models.User.find(query, function(err, users) {
		if (err) throw err;
		
		if (users.length > 0) {
			if (users.length > 1 || (session.auth && session.auth.loggedIn == true)) {
				return cb(["LinkedIn account already linked"])
			}
			
			cb(null, users[0])
		} else {
			if (session.auth && session.auth.loggedIn == true) {
				// Update the user's linkedin token
				models.User.findOne({
					_id: mongoose.Types.ObjectId(session.auth.userId)
				}, function(err, user) {
					if (err) throw err;
					
					user.updateLinkedIn(meta, accessToken, accessSecret, function(err) {
						cb(null, user);
					})
				})
			} else {
				// Create user
				models.User.createWithLinkedIn(meta, accessToken, accessSecret, function(err, aUser) {
					cb(null, aUser);
				});
			}
		}
	});
}

scheme.statics.createWithPassword = function (login, password, cb, extra) {
	console.log("Registering with login/password");
	
	var user = new exports.User({
		email: login,
		created: Date.now()
	});
	user.setPassword(password)
	
	// Extra provided by registration
	if (extra.name != null) {
		user.setName(extra.name);
	}
	
	user.save(function(err) {
		cb(err, user);
	})
}

scheme.statics.createWithTwitter = function(meta, accessToken, accessTokenSecret, cb) {
	console.log("Twitter meta: " + meta)
	
	var avatar = meta.profile_image_url;
	if (avatar.indexOf("_normal") != -1) {
		avatar = avatar.replace("_normal", "");
	}
	
	var user = new exports.User({
		twitter: {
			userid: meta.id
		},
		avatar: avatar,
		location: meta.location,
		requestEmail: true,
		created: Date.now()
	});
	user.setName(meta.name);
	
	user.save(function(err) {
		var smeta = new models.SocialMetadata({
			type: "twitter",
			meta: meta,
			accessToken: accessToken,
			accessSecret: accessTokenSecret,
			user: user._id
		})
		smeta.save();
		
		cb(err, user);
	});
}
scheme.statics.createWithFacebook = function (meta, accessToken, accessTokenSecret, cb) {
	var user = new exports.User({
		facebook: {
			userid: meta.id
		},
		requestEmail: false,
		created: Date.now(),
		avatar: 'http://graph.facebook.com/'+meta.id+'/picture?type=large'
	})
	if (meta.location) {
		user.location = meta.location;
	} if (meta.first_name) {
		user.name = meta.first_name;
	} if (meta.last_name) {
		user.surname = meta.last_name;
	} if (meta.link) {
		user.website = meta.link;
	} if (meta.email) {
		user.email = meta.email;
	}
	if (meta.work && meta.work.length > 0) {
		user.position = meta.work[0].description;
	}
	if (meta.education && meta.education.length > 0 && meta.education[0].school.name) {
		user.education = meta.education[0].school.name;
	}
	
	user.save(function(err) {
		var smeta = new models.SocialMetadata({
			type: "facebook",
			meta: meta,
			accessToken: accessToken,
			accessSecret: accessTokenSecret,
			user: user._id
		})
		smeta.save();
		
		cb(err, user);
	})
}
scheme.statics.createWithLinkedIn = function (meta, accessToken, accessTokenSecret, cb) {
	var user = new exports.User({
		linkedin: {
			userid: meta.id
		},
		location: meta.location,
		requestEmail: true,
		created: Date.now(),
		name: meta.firstName,
		surname: meta.lastName,
		location: meta.location.name,
		website: meta.publicProfileUrl,
		interests: meta.industry,
		position: meta.headline,
		desc: meta.summary
	})
	
	user.save(function(err) {
		var smeta = new models.SocialMetadata({
			type: "linkedin",
			meta: meta,
			accessToken: accessToken,
			accessSecret: accessTokenSecret,
			user: user._id
		})
		smeta.save();
		
		cb(err, user);
	})
}

exports.User = mongoose.model("User", scheme);