var mongoose = require('mongoose')
	, crypto = require('crypto')
	, https = require('https')
	, SocialMetadata = require('./SocialMetadata').SocialMetadata
	, gm = require('gm')
	, config = require('../config')
	, request = require('request')
	, fs = require('fs')
	, colors = require('colors')
	, async = require('async')

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	created: {
		type: Date,
		default: Date.now
	},
	disabled: { type: Boolean, default: false },
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
	avatar: { type: String, default: "" },
	facebook: {
		userid: String
	},
	twitter: {
		userid: String
	},
	linkedin: {
		userid: String
	},
	savedProfiles: [
		{
			_id: {
				type: ObjectId,
				ref: 'User'
			},
			eventid: {
				type: ObjectId,
				ref: 'Event'
			}
		}
	],
	receivedCards: [{
		from: {
			type: ObjectId,
			ref: 'User'
		},
		card: {
			type: ObjectId,
			ref: 'Card'
		},
		eventid: {
			type: ObjectId,
			ref: 'Event'
		},
		sent: { type: Date, default: Date.now }
	}],
	privacy: {
		allowPM: { type: Boolean, default: true },
		allowWall: { type: Boolean, default: true },
		allowLocation: { type: Boolean, default: true },
		showProfile: { type: Boolean, default: true },
	},
	notification: {
		email: {
			privateMessages: { type: Boolean, default: true },
			businessCards: { type: Boolean, default: true },
			comments: { type: Boolean, default: true },
			savedProfile: { type: Boolean, default: true },
		},
		mobile: {
			privateMessages: { type: Boolean, default: true },
			businessCards: { type: Boolean, default: true },
			comments: { type: Boolean, default: true },
			savedProfile: { type: Boolean, default: true },
			messages: { type: Boolean, default: true },
		},
	},
	requestEmail: { type: Boolean, default: false },
	admin: { type: Boolean, default: false },
	mailboxUnread: { type: Number, default: 0 },
	lastAccess: { type: Date, default: Date.now }, // is being used to track user's online status. Notifications to email will only ever be sent when the lastAccess is > X minutes.
	
	isFeedbackProfile: { type: Boolean, default: false },
	feedbackProfileEvent: { type: ObjectId, ref: 'Event' }
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

scheme.methods.createThumbnails = function(callback) {
	var u = this;
	
	if (!u.avatar || u.avatar.substr(u.avatar.length-3, u.avatar.length-1) == 'svg') {
		console.log("[ERR]\t".red, "Blank/Invalid avatar!")
		
		callback();
		return;
	}

	var pub = config.path+"/public";
	
	var cb = function() {
		console.log("[OK]\t".green, "Converting "+u.avatar);
		
		async.parallel([
			function(cb) {
				// Circle-size images first
				gm(pub+u.avatar).gravity('Center').thumb(116, 116, pub+u.avatar+"-116x116.png", 100, function(err) {
					if (err) {
						console.log("[ERR]\t".red, "Error Thumbnail with ", pub+u.avatar);
						cb(err);
					} else {
						if (config.knox) {
							config.knox.putFile(pub+u.avatar+"-116x116.png", "/public"+u.avatar+"-116x116.png", function(err, res) {
								if (err) throw err;
								
								console.log("-116x116.png uploaded");
								res.resume();
							})
						}
						
						console.log("[DONE]\t".green, "Converted 116x116")
						cb(null);
					}
				});
			},
			function(cb) {
				// Homepage-size
				gm(pub+u.avatar).gravity('Center').thumb(285, 148, pub+u.avatar+"-285x148.png", 100, function(err) {
					if (err) {
						console.log("[ERR]\t".red, "Error Creating Circle with ", pub+u.avatar);
						cb(err);
					} else {
						if (config.knox) {
							config.knox.putFile(pub+u.avatar+"-285x148.png", "/public"+u.avatar+"-285x148.png", function(err, res) {
								if (err) throw err;
								
								console.log("-285x148.png uploaded to S3");
								res.resume();
							})
						}
						
						console.log("[DONE]\t".green, "Converted 285x148")
						cb(null);
					}
				});
			}
		], function(err) {
			if (err) {
				console.log("[ERR]\t".red, "Thumbnail Creation Failed!", pub+u.avatar);
			} else {
				console.log("[DONE]\t".green, "Converted "+u._id);
			}
			
			callback()
		})
	}
	
	// if is url, download it (in other words, if it !begins with /profileavatars/_id.ext then DL and replace)
	if (u.avatar.substring(0, 1) != "/") {
		console.log("[OK]\t".green, "Downloading "+u.avatar);
		request(u.avatar, function(err, incoming, response) {
			if (err) throw err;
			
			//404 protection..
			if (incoming.statusCode != 200) {
				//Code later assumes default avatar
				console.log("[ERR]\t".red, incoming.statusCode.bold, " Download failed!");
				u.avatar = "";
				
				callback();
				return;
			}
			
			u.avatar = "/profileavatars/"+u._id;
			
			if (config.knox) {
				config.knox.putFile(pub+"/profileavatars/"+u._id, "/profileavatars/"+u._id, function(err, res) {
					if (err) throw err;
					
					console.log("Uploading a downloaded img");
					res.resume();
				})
			}
			
			cb();
		}).pipe(fs.createWriteStream(pub+"/profileavatars/"+u._id));
	} else {
		cb();
	}
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
		email: email,
		twitter : { "$exists" : false },
		facebook : { "$exists" : false },
		linkedin : { "$exists" : false },
		disabled: false
	}, function(err, user) {
		if (err) throw err;
		
		if (user == null) {
			// register user
			if (!extra || !extra.name || extra.name.length == 0) {
				cb(["Please Register (enter Name)"]);
			} else {
				exports.User.createWithPassword(email, password, function(err, regUser) {
					cb(null, regUser);
				}, extra);
			}
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
		'twitter.userid': meta.id,
		disabled: false
	}
	
	exports.User.find(query, function(err, users) {
		if (err) throw err;
		
		if (users.length == 1) {
			cb(null, users[0])
			return;
		} else if (users.length == 0) {
			// Create a profile
			// Create user
			exports.User.createWithTwitter(meta, accessToken, accessSecret, function(err, aUser) {
				cb(null, aUser);
			});
			return;
		}
		
		cb(["Twitter account already linked"])
	});
}
scheme.statics.authenticateFacebook = function (accessToken, accessSecret, meta, cb) {
	var query = {
		'facebook.userid': meta.id,
		disabled: false
	}
	
	exports.User.find(query, function(err, users) {
		if (err) throw err;
		
		if (users.length == 1) {
			cb(null, users[0])
			return;
		} else if (users.length == 0) {
			// Create a profile
			// Create user
			exports.User.createWithFacebook(meta, accessToken, accessSecret, function(err, aUser) {
				cb(null, aUser);
			});
			return;
		}
		
		cb(["Facebook account already linked"])
	});
}
scheme.statics.authenticateLinkedIn = function (accessToken, accessSecret, meta, cb) {
	var query = {
		'linkedin.userid': meta.id,
		disabled: false
	}
	
	exports.User.find(query, function(err, users) {
		if (err) throw err;
		
		if (users.length == 1) {
			cb(null, users[0])
			return;
		} else if (users.length == 0) {
			// Create a profile
			// Create user
			exports.User.createWithLinkedIn(meta, accessToken, accessSecret, function(err, aUser) {
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
	
	user.createThumbnails(function() {
		user.save(function(err) {
			var smeta = new SocialMetadata({
				type: "twitter",
				meta: meta,
				accessToken: accessToken,
				accessSecret: accessTokenSecret,
				user: user._id
			})
			smeta.save();
			
			cb(err, user);
		})
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
	if (_meta.location && _meta.location.name) {
		user.location = _meta.location.name;
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
	
	user.createThumbnails(function() {
		user.save(function(err) {
			var smeta = new SocialMetadata({
				type: "facebook",
				meta: meta,
				accessToken: accessToken,
				accessSecret: accessTokenSecret,
				user: user._id
			})
			smeta.save();
			
			cb(err, user);
		})
	})
}
scheme.statics.createWithLinkedIn = function (meta, accessToken, accessTokenSecret, cb) {
	console.log(meta);
	var _meta = meta._json;
	console.log(_meta);

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
		company: _meta.company,
		position: _meta.headline,
		desc: _meta.summary
	})
	
	user.save(function(err) {
		var smeta = new SocialMetadata({
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
