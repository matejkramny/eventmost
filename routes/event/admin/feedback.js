var fs = require('fs'),
	models = require('../../../models')
	, mongoose = require('mongoose')
	, util = require('../../../util')
	, event = require('../event')
	, feedbackinbox = require('./feedbackInbox/feedbackinbox')

exports.router = function (app) {
	app.get('/event/:id/admin/feedback', eventFeedbackProfile)
		.get('/event/:id/admin/feedback/new', newFeedbackProfile)
		.post('/event/:id/admin/feedback/edit', getProfile, doEditFeedbackProfile)
		.get('/event/:id/admin/feedback/:fid', getProfile, editFeedbackProfile)
		.get('/event/:id/admin/feedback/:fid/*', getProfile)

		feedbackinbox.router(app)
}

function eventFeedbackProfile (req, res) {
	res.render('event/admin/feedback', { title: "Feedback Profile" })
}

function newFeedbackProfile (req, res) {
	res.render('event/admin/editFeedback', { title: "Create a new Feedback Profile" });
}

function getProfile (req, res, next) {
	var fid = req.params.fid || req.body._id;
	var ev = res.locals.ev;
	
	try {
		fid = mongoose.Types.ObjectId(fid)
	} catch (e) {
		next()
		return;
	}
	
	var attendee;
	for (var i = 0; i < ev.attendees.length; i++) {
		if (ev.attendees[i]._id.equals(fid)) {
			attendee = ev.attendees[i];
			break;
		}
	}
	
	res.locals.feedbackProfile = attendee;
	next()
}

function editFeedbackProfile (req, res) {
	if (!res.locals.feedbackProfile) {
		res.redirect('/event/'+res.locals.ev._id+'/admin/feedback')
		return;
	}
	
	res.render('event/admin/editFeedback', { title: "Edit Feedback Profile "+res.locals.feedbackProfile.user.getName() });
}

function doEditFeedbackProfile (req, res) {
	var attendee = res.locals.feedbackProfile;
	var profile;
	
	if (!attendee) {
		profile = new models.User({
			isFeedbackProfile: true,
			feedbackProfileEvent: res.locals.ev._id
		})
	} else {
		profile = attendee.user;
	}
	
	profile.position = req.body.position;
	profile.company = req.body.company;
	profile.website = req.body.website;
	profile.desc = req.body.desc;
	profile.setName(req.body.name);
	
	if (req.files && req.files.avatar != null && req.files.avatar.name.length != 0) {
		var ext = req.files.avatar.type.split('/');
		var ext = ext[ext.length-1];
		profile.avatar = "/profileavatars/"+profile._id+"."+ext;
		
		fs.readFile(req.files.avatar.path, function(err, avatar) {
			fs.writeFile(__dirname + "/../../../public"+profile.avatar, avatar, function(err) {
				if (err) throw err;
			});
		});
	}
	
	profile.save();
	
	if (!res.locals.feedbackProfile) {
		attendee = new models.Attendee({
			user: profile._id,
			category: req.body.category || "Attendee"
		})
		attendee.save()
		
		res.locals.ev.attendees.push(attendee._id)
	} else {
		attendee.category = req.body.category || "Attendee";
		attendee.save()
	}
	
	res.locals.ev.save()
	
	res.format({
		html: function() {
			res.redirect('/event/'+res.locals.ev._id+'/admin/feedback')
		},
		json: function() {
			res.send({
				status: 200
			})
		}
	})
}