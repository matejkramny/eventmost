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
	avatar: { type: String, default: "/imgages/big-avatar.svg" },
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
		this.name = "";
		this.surname = "";
		// TODO log this exception
	}
}
scheme.methods.getName = function () {
	var name;
	
	if ((this.name != null && this.name.length != 0) || (this.surname != null && this.surname.length != 0)) {
		if (this.surname && this.name) {
			name = this.name + " " + this.surname;
		} else {
			name = this.name == null ? this.surname : this.name;
		}
	} else {
		name = this.email;
	}
	
	if (!name) {
		return ""
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
scheme.statics.authenticateTwitter = function (accessToken, accessSecret, meta, cb) {
	var query = {
		'twitter.userid': meta.id
	}
	
	models.User.find(query, function(err, users) {
		if (err) throw err;
		
		if (users.length == 1) {
			cb(null, users[0])
			return;
		} else if (users.length == 0) {
			// Create a profile
			// Create user
			models.User.createWithTwitter(meta, accessToken, accessSecret, function(err, aUser) {
				cb(null, aUser);
			});
			return;
		}
		
		cb(["Twitter account already linked"])
	});
}
scheme.statics.authenticateFacebook = function (accessToken, accessSecret, meta, cb) {
	var query = {
		'facebook.userid': meta.id
	}
	
	models.User.find(query, function(err, users) {
		if (err) throw err;
		
		if (users.length == 1) {
			cb(null, users[0])
			return;
		} else if (users.length == 0) {
			// Create a profile
			// Create user
			models.User.createWithFacebook(meta, accessToken, accessSecret, function(err, aUser) {
				cb(null, aUser);
			});
			return;
		}
		
		cb(["Facebook account already linked"])
	});
}
scheme.statics.authenticateLinkedIn = function (accessToken, accessSecret, meta, cb) {
	var query = {
		'linkedin.userid': meta.id
	}
	
	models.User.find(query, function(err, users) {
		if (err) throw err;
		
		if (users.length == 1) {
			cb(null, users[0])
			return;
		} else if (users.length == 0) {
			// Create a profile
			// Create user
			models.User.createWithLinkedIn(meta, accessToken, accessSecret, function(err, aUser) {
				cb(null, aUser);
			});
			return;
		}
		
		cb(["LinkedIn account already linked"])
	});
}

scheme.statics.createWithPassword = function (login, password, cb, extra) {
	var user = new exports.User({
		email: login,
		created: Date.now()
	});
	user.setPassword(password)
	
	// Extra provided by registration
	if (extra && extra.name != null) {
		user.setName(extra.name);
	}
	
	user.save(function(err) {
		cb(err, user);
	})
}

scheme.statics.createWithTwitter = function(meta, accessToken, accessTokenSecret, cb) {
	var _meta = meta._json
	
	var avatar = _meta.profile_image_url;
	if (avatar.indexOf("_normal") != -1) {
		avatar = avatar.replace("_normal", "");
	}
	
	var user = new exports.User({
		twitter: {
			userid: meta.id
		},
		avatar: avatar,
		location: _meta.location,
		requestEmail: true,
		created: Date.now()
	});
	user.setName(_meta.name);
	
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
	var _meta = meta._json;
	var user = new exports.User({
		facebook: {
			userid: meta.id
		},
		requestEmail: false,
		created: Date.now(),
		avatar: 'http://graph.facebook.com/'+_meta.id+'/picture?type=large'
	})
	if (_meta.location) {
		user.location = _meta.location;
	} if (_meta.first_name) {
		user.name = _meta.first_name;
	} if (_meta.last_name) {
		user.surname = _meta.last_name;
	} if (_meta.link) {
		user.website = _meta.link;
	} if (_meta.email) {
		user.email = _meta.email;
	}
	if (_meta.work && _meta.work.length > 0) {
		user.position = _meta.work[0].description;
	}
	if (_meta.education && _meta.education.length > 0 && _meta.education[0].school.name) {
		user.education = _meta.education[0].school.name;
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
	var _meta = meta._json;
	var user = new exports.User({
		linkedin: {
			userid: meta.id
		},
		avatar: _meta.pictureUrl,
		email: _meta.emailAddress,
		created: Date.now(),
		name: _meta.firstName,
		surname: _meta.lastName,
		location: _meta.location.name,
		website: _meta.publicProfileUrl,
		interests: _meta.industry,
		position: _meta.headline,
		desc: _meta.summary
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