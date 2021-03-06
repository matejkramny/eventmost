var fs = require('fs'),
	models = require('../models')
	, mongoose = require('mongoose')
	, util = require('../util')
	, inbox = require('./inbox/index')
	, async = require('async')
	, check = require('validator').check
	, config = require('../config')

exports.router = function (app) {
	app.get('/profile', util.authorized, profile)
		.post('/profile/edit', util.authorized, doEditProfile)
		.get('/user/:id', util.authorized, viewUser)
		.all('/user/:id/*', util.authorized)
		.get('/user/:id/save', saveUser)
		.get('/user/:id/remove', removeProfile)
		//.post('/api/profile', util.authorized, profile)
		//.post('/api/profile/edit', util.authorized, doEditProfile)
		//.get('/api/user/:id', viewUser)
		//.all('/api/user/:id/*', util.authorized)
		//.get('/api/user/:id/save', saveUser)
		//.get('/api/user/:id/remove', removeProfile)
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
	
	res.redirect('/profiles')
}

exports.profile = profile = function (req, res) {
	
	console.log("/profile".red);
	res.format({
		html: function() {
			res.render('profile/view', { title: "My Profile" })
		},
		json: function() {
			res.json({
				user: req.user
			})
		}
	});
}

function viewUser (req, res) {
	var id = req.params.id;
	
	models.User.findById(id).populate('savedProfiles').exec(function(err, user) {
		if (err) throw err;
		
		if (!user) {
			res.format({
				json: function() {
					res.send(404, {})
				},
				html: function() {
					// flash..
					res.redirect('/')
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
				html: function() {
					if (user != null) {
						res.locals.theUser = user; //locals.user is the logged in user..
						res.locals.saved = saved;
						res.render('user', { title: user.getName() });
					} else {
						res.status(404);
						res.redirect('/')
					}
				},
				json: function() {
					//TODO Disabled until the API is 'secure'
				
					res.status(404);
					res.send({
						message: "not found"
					})
					return;
				
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
	
	console.log("Save User ".red);
	var id = req.params.id;
	
	models.User.findOne({
		_id: mongoose.Types.ObjectId(id)
	}, function(err, user) {
		if (err) throw err;
		
		if (!user) {
			res.redirect('/');
			return;
		}
		
		//console.log(req.user);
		/*
		- Check if already exist.
		- Add / skip
		- Redirect

		*/

		async.series([
		    function (callback){

		    	models.User.findOne({
						_id: mongoose.Types.ObjectId(req.user._id)
					}, function(err, loggedInUser) {
						console.log(loggedInUser);
						console.log(loggedInUser.savedProfiles);
						if(loggedInUser.savedProfiles.length > 0){
							//User have some saved profiles which needs to be verified...
							for (var i = 0; i < loggedInUser.savedProfiles.length; i++) {
								if (loggedInUser.savedProfiles[i]._id && loggedInUser.savedProfiles[i]._id.equals(user._id)) {
									console.log("matched");
									res.redirect('/messages')
									return;
								}
							}
						}
						//User doesn't have any saved profile...\
						console.log("not matched");
						loggedInUser.savedProfiles.push({
							_id: user._id
						})
						loggedInUser.save(function (err){
							callback();
							
						});
						
						//callback();
					});
		    	
		    }
		], function (err, results) {
		    // Here, results is an array of the value from each function
		    //console.log(results); // outputs: ['two', 'five']
		    console.log("going to messages");
			res.redirect('/messages');
			return;

		});

		/*for (var i = 0; i < req.user.savedProfiles.length; i++) {
			if (req.user.savedProfiles[i] && req.user.savedProfiles[i]._id.equals(user._id)) {
				res.redirect('/messages')
				return;
			}
		}
		
		if (user.notification.email.savedProfile) {
			inbox.emailNotification(user, "inbox")
		}
		user.mailboxUnread++;
		user.save();
		
		req.user.savedProfiles.push({
			_id: user._id
		})
		req.user.save()
		res.redirect('/messages')*/
		
	});
	
}

exports.doEditProfile = doEditProfile = function (req, res) {
	// this works as incremental form submission.. some fields may save, some may not. It saves nevertheless (the valid ones)
	// the requirements are very lenient
	console.log(req.body)
	console.log("PS19 # Going to edit profile".red);
	var errors = [];
	var u = req.user;
	
	
	var blocking = false;
	var cb = function () {
		u.save(function(err) {
			if (err) throw err;
		})
		
		res.format({
			json: function() {
				res.send({
					status: errors.length == 0 ? 200 : 400,
					err: errors
				})
			},
			html: function() {
				req.session.flash = errors;
				req.session.flash.push("Profile updated!")
				res.redirect('/profile');
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
		console.log("PS19 # Crashed".red);
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
	
	if (typeof req.body.education !== 'undefined') {
		u.education = req.body.education;
	}
	
	
	console.log("Company ".red + req.body.company);
	
	console.log("U Company".red);
	if (typeof req.body.company !== 'undefined') {
		u.company = req.body.company;
	}
	if (typeof req.body.position !== 'undefined') {
		u.position = req.body.position;
	}
	if (typeof req.body.location !== 'undefined') {
		u.location = req.body.location;
	}
	if (typeof req.body.interests !== 'undefined') {
		u.interests = req.body.interests;
	}
	if (typeof req.body.website !== 'undefined') {
		u.website = req.body.website;
	}
	if (typeof req.body.education !== 'undefined') {
		u.education = req.body.education;
	}
	if (typeof req.body.desc !== 'undefined') {
		u.desc = req.body.desc;
	}else{
		u.desc="Hardcode description";
	}
	
	
	//console.log("Description ".red + req.body.desc);
	
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
			if (err) 
			{
				
				throw err;
			}
			
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
}
