var fs = require('fs')
	, models = require('../../../../models')
	, mongoose = require('mongoose')
	, util = require('../../util')
	, async = require('async')
	, transport = require('../../../../app').transport

exports.router = function (app) {
	app.post('/api/inbox/savedProfiles', exports.showSavedProfilesAPI)
	app.post('/api/inbox/saverProfiles', exports.showSaverProfilesAPI)
}

exports.showSavedProfilesAPI = function (req, res) {
	
	models.User.findOne({_id:req.body._id} , function(err, current_user) 
	{
		var query = {'_id': {$in: current_user.savedProfiles}};
		
		models.User.find(query)
		.exec(function(err, savedprofiles) {
			if (err) throw err;
			if (savedprofiles) {
				res.format({
					json: function() {
						res.send({
							profilessaved: savedprofiles
						});
					}
				});
			}
		});
	});
}

exports.showSaverProfilesAPI = function (req, res) {
	
		var query = {savedProfiles: req.body._id};
		
		models.User.find(query)
		.exec(function(err, savedprofiles) {
			if (err) throw err;
			if (savedprofiles) {
				
				res.format({
					json: function() {
						res.send({
							profilesavers: savedprofiles
						});
					}
				});
			}
		});
}
