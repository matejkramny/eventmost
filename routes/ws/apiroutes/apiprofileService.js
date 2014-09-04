var fs = require('fs')
	, models = require('../../../models')
	, mongoose = require('mongoose')
	, util = require('../util')
	, inbox = require('./apiinbox/index')
	, check = require('validator').check
	, config = require('../../../config');

exports.router = function (app) {
	
	console.log("Mobile Profile Service Router");
		//app.get('/api/test',function(req,res){res.send({token:"Test Token"})})
		app.post('/api/profile', util.authorized, profile)
		.post('/api/profile/edit', util.authorized, doEditProfile)
		.get('/api/user/:id', viewUser)
		.all('/api/user/:id/*', util.authorized)
		.get('/api/user/:id/save', saveUser)
		.get('/api/user/:id/remove', removeProfile)
}

function removeProfile (req, res) {
	var id = req.params.id;
	
	var removeIndex = -1;
	for (var i = 0; i < req.user.savedProfiles.length; i++) {
		var uid = req.user.savedProfiles[i];
		if (uid.equals(mongoose.Types.ObjectId(id))) {
			removeIndex = i;
			break;
		}
	}
	
	if (removeIndex != -1) {
		req.user.savedProfiles.splice(removeIndex, 1);
		req.user.save(function(err) {
			if (err) throw err;
		})
	}
	
	res.send({removeProfile:true})
}

exports.profile = profile = function (req, res) {
	
	console.log("/api/profile".red);
	res.format({
		json: function() {
			res.json({
				user: req.user
			})
		}
	});
}

function viewUser (req, res) {
	
	console.log("/api/profile".red);
	var id = req.params.id;
	
	models.User.findById(id).populate('savedProfiles').exec(function(err, user) {
		if (err) throw err;
		
		if (!user) {
			res.format({
				json: function() {
					res.send(404, {})
				}
			})
			return;
		}
		
		// check if user is self or user is 
		var saved = false;
		for (var i = 0; i < req.user.savedProfiles.length; i++) {
			var uid = req.user.savedProfiles[i]._id;
			if (uid && uid.equals(user._id)) {
				saved = true;
				break;
			}
		}
		
		models.Card.findOne({ user: id, primary: true }, function(err, primaryCard) {
			if (err) throw err;
			
			res.locals.primaryCard = primaryCard;
			
			res.format({
				json: function() {
					if (user != null) {
						res.send({
							user: user
						})
					} else {
						res.status(404);
						res.send({
							message: "not found"
						})
					}
				}
			})
		})
	})
}

function saveUser (req, res) {
	var id = req.params.id;
	
	models.User.findOne({
		_id: mongoose.Types.ObjectId(id)
	}, function(err, user) {
		if (err) throw err;
		
		if (!user) {
			res.send({saveStatus:"fault"});
			return;
		}
		
		for (var i = 0; i < req.user.savedProfiles.length; i++) {
			if (req.user.savedProfiles[i] && req.user.savedProfiles[i]._id.equals(user._id)) {
				res.send({saveStatus:"ok"})
				return;
			}
		}
		
		if (user.notification.email.savedProfile) {
			//inbox.emailNotification(user, "inbox")
		}
		user.mailboxUnread++;
		user.save();
		
		req.user.savedProfiles.push({
			_id: user._id
		})
		req.user.save()
	});
}

exports.doEditProfile = doEditProfile = function (req, res) {
	// this works as incremental form submission.. some fields may save, some may not. It saves nevertheless (the valid ones)
	// the requirements are very lenient
	var errors = [];
	//var u = new models.User();
	
	models.User.findOne({_id:req.body._id} , function(err, u) {
	
	
	console.log("/api/profile/edit".red);
	
	var blocking = false;
	var cb = function () {
		console.log(u);
		
		u.save(function(err) {
			console.log("Save Error ".red + err);
			
			if (err) throw err;
		})
		
		res.format({
			json: function() {
				res.send({
					status: errors.length == 0 ? 200 : 400,
					err: errors,
					editProfile:true
				})
			}
		})
	}
	
	try {
		if (typeof req.body.email !== 'undefined') {
			check(req.body.email, 'Please Enter an Email Address').notNull().isEmail()
			
			if (u.email != req.body.email) {
				blocking = true;
				models.User.find({ email: req.body.email }, function(err, emails) {
					if (err) throw err;
					if (emails.length) {
						// email taken
						errors.push("Email "+req.body.email+" is already taken")
					} else {
						// email free
						u.email = req.body.email;
					}
			
					cb()
				});
			}
		}
		
		if (typeof req.body.name !== 'undefined') {
			check(req.body.name, 'Please Enter your First Name').notNull()
			u.name = req.body.name;
		}
		if (typeof req.body.surname !== 'undefined') {
			check(req.body.surname, 'Please Enter your Last Name').notNull()
			u.surname = req.body.surname;
		}
	} catch (e) {
		console.log("Exception Caught ".red + e);
		errors.push(e.message)
	}
	
	//Privacy
	if (typeof req.body.showProfile !== 'undefined') {
		u.privacy.showProfile = req.body.showProfile == 'yes' ? true : false;
	}
	if (typeof req.body.allowLocation !== 'undefined') {
		u.privacy.allowLocation = req.body.allowLocation == 'yes' ? true : false;
	}
	if (typeof req.body.allowWall !== 'undefined') {
		u.privacy.allowWall = req.body.allowWall == 'yes' ? true : false;
	}
	if (typeof req.body.allowPM !== 'undefined') {
		u.privacy.allowPM = req.body.allowPM == 'yes' ? true : false;
	}
	
	//Notification - Email Stuff 
	if (typeof req.body.emailPrivateMessages !== 'undefined') {
		u.notification.email.privateMessages = req.body.emailPrivateMessages == 'yes' ? true : false;
	}
	if (typeof req.body.emailBusinessCards !== 'undefined') {
		u.notification.email.businessCards = req.body.emailBusinessCards == 'yes' ? true : false;
	}
	if (typeof req.body.emailComments !== 'undefined') {
		u.notification.email.comments = req.body.emailComments == 'yes' ? true : false;
	}
	if (typeof req.body.emailSavedProfile !== 'undefined') {
		u.notification.email.savedProfile = req.body.emailSavedProfile == 'yes' ? true : false;
	}
	//Notification - Mobile Stuff 
	if (typeof req.body.mobilePrivateMessages !== 'undefined') {
		u.notification.mobile.privateMessages = req.body.mobilePrivateMessages == 'yes' ? true : false;
	}
	if (typeof req.body.mobileBusinessCards !== 'undefined') {
		u.notification.mobile.businessCards = req.body.mobileBusinessCards == 'yes' ? true : false;
	}
	if (typeof req.body.mobileComments !== 'undefined') {
		u.notification.mobile.comments = req.body.mobileComments == 'yes' ? true : false;
	}
	if (typeof req.body.mobileSavedProfile !== 'undefined') {
		u.notification.mobile.savedProfile = req.body.mobileSavedProfile == 'yes' ? true : false;
	}
	if (typeof req.body.mobileMessage !== 'undefined') {
		u.notification.mobile.messages = req.body.mobileMessage == 'yes' ? true : false;
	}
	

	
	if (typeof req.body.company !== 'undefined') {
		u.company = req.body.company;
	}
	if (typeof req.body.position !== 'undefined') {
		u.position = req.body.position;
	}
	if (typeof req.body.location !== 'undefined') {
		u.location = req.body.location;
	}
	if (typeof req.body.interest !== 'undefined') {
		u.interests = req.body.interest;
	}
	if (typeof req.body.website !== 'undefined') {
		u.website = req.body.website;
	}
	if (typeof req.body.education !== 'undefined') {
		u.education = req.body.education;
	}
	if (typeof req.body.desc !== 'undefined') {
		u.desc = req.body.desc;
	}
	
	if (req.body.password && req.body.password.length > 0) {
		// user wants to change/create a password
		if (req.body.password == req.body.password_old) {
			errors.push("New password and old password must not be the same")
		} else if (!u.password || u.password == models.User.getHash(req.body.password_old)) {
			if (!u.password && !u.email) {
				errors.push("You will need to add an email address before you can log in with a password.")
			}
			
			u.setPassword(req.body.password);
		} else {
			errors.push("Incorrect old password");
		}
	}
	
	if (req.files && req.files.avatar != null && req.files.avatar.name.length != 0) {
		var ext = req.files.avatar.type.split('/');
		var ext = ext[ext.length-1];
		u.avatar = "/profileavatars/"+u._id+"."+ext;
		
		var createThumbnails = function() {
			u.createThumbnails(function(){});
		}
		if (!blocking) {
			blocking = true;
			createThumbnails = function() {
				u.createThumbnails(function() {
					cb()
				});
			}
		}
		
		fs.rename(req.files.avatar.path, config.path + "/public"+u.avatar, function(err) {
			if (err) throw err;
			
			if (config.knox) {
				config.knox.putFile(config.path + "/public"+u.avatar, "/public"+u.avatar, function(err, res) {
					if (err) throw err;
					
					console.log("Profile File Uploaded");
					res.resume();
				})
			}
			
			createThumbnails()
		})
	}
	
	if (!blocking) {
		cb()
	}
	})
}
