var fs = require('fs'),
	models = require('../models')
	, mongoose = require('mongoose')
	, util = require('../util')

exports.router = function (app) {
	app.get('/profile', util.authorized, profile)
		.post('/profile/edit', util.authorized, doEditProfile)
		.get('/user/:id', util.authorized, viewUser)
		.get('/user/:id/save', util.authorized, saveUser)
		.get('/profiles', util.authorized, showProfiles)
		.get('/user/:id/remove', util.authorized, removeProfile)
}

function showProfiles (req, res) {
	req.user.populate('savedProfiles', function() {
		res.format({
			html: function() {
				res.render('profiles', { profiles: req.user.savedProfiles || [] })
			},
			json: function() {
				res.json({
					profiles: req.user.savedProfiles
				})
			}
		})
	})
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
	res.format({
		html: function() {
			res.render('profile/view')
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
	
	models.User.findOne({
		_id: mongoose.Types.ObjectId(id)
	}, function(err, user) {
		if (err) throw err;
		
		// check if user is self or user is 
		console.log(req.user.savedProfiles)
		var saved = false;
		for (var i = 0; i < req.user.savedProfiles.length; i++) {
			var uid = req.user.savedProfiles[i];
			if (uid.equals(user._id)) {
				saved = true;
				break;
			}
		}
		
		console.log("Saved "+saved)
		
		res.format({
			html: function() {
				console.log(user.getName());
				if (user != null) {
					res.locals.prof = user;
					res.locals.saved = saved;
					res.render('user');
				} else {
					res.status(404);
					res.redirect('/')
				}
			},
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
}

function saveUser (req, res) {
	var id = req.params.id;
	
	models.User.findOne({
		_id: mongoose.Types.ObjectId(id)
	}, function(err, user) {
		if (err) throw err;
		
		req.user.savedProfiles.push({
			_id: user._id
		})
		req.user.save(function() {
			res.redirect('/profiles')
		})
	});
}

exports.doEditProfile = doEditProfile = function (req, res) {
	// this works as incremental form submission.. some fields may save, some may not. It saves nevertheless (the valid ones)
	// the requirements are very lenient
	var errors = [];
	var u = req.user;
	
	var blocking = false;
	var cb = function () {
		u.save(function(err) {
			if (err) throw err;
		})
	
		req.session.flash = errors;
		req.session.flash.push("Profile updated!")
		res.redirect('/profile');
	}
	
	if (req.body.email.length == 0 && req.body.name.length == 0 && req.body.surname.length == 0) {
		errors.push("You must enter an email address, your first name or your last name.");
	} else {
		u.name = req.body.name;
		u.surname = req.body.surname;
		
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
	
	u.company = req.body.company;
	u.position = req.body.position;
	u.location = req.body.location;
	u.interests = req.body.interests;
	u.website = req.body.website;
	u.education = req.body.education;
	u.desc = req.body.desc;
	
	if (req.body.password.length > 0) {
		// user wants to change password
		if (req.body.password == req.body.password_old) {
			errors.push("New password and old password must not be the same")
		} else if (u.password == models.User.getHash(req.body.password)) {
			u.setPassword(req.body.password);
			errors.push("Password updated!")
		} else {
			errors.push("Incorrect old password");
		}
	}
	
	if (req.files.avatar != null && req.files.avatar.name.length != 0) {
		var ext = req.files.avatar.type.split('/');
		var ext = ext[ext.length-1];
		u.avatar = "/profileavatars/"+u._id+"."+ext;
		
		fs.readFile(req.files.avatar.path, function(err, avatar) {
			fs.writeFile(__dirname + "/../public"+u.avatar, avatar, function(err) {
				if (err) throw err;
			});
		});
	}
	
	if (!blocking) {
		cb()
	}
}
