var fs = require('fs'),
	models = require('../models')

exports.router = function (app) {
	app.get('/profile', profile)
		.post('/profile/edit', doEditProfile)
}


exports.profile = profile = function (req, res) {
	res.render('profile/view')
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
