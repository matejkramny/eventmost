var fs = require('fs')
	, models = require('../../../../models')
	, mongoose = require('mongoose')
	, util = require('../../util')
	, async = require('async')
	, transport = require('../../../../app').transport

exports.router = function (app) {
	app.post('/api/inbox/savedProfiles', exports.showSavedProfilesAPI)
	app.post('/api/inbox/saverProfiles', exports.showSaverProfilesAPI)
	app.post('/api/privacysetting', privacysettings)
	app.post('/api/notificationsetting', notificationsettings)
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

function notificationsettings(req, res){
	var user_id = req.body._id;
	var messages = req.body.messages;
	var savedProfile = req.body.savedProfile;
	var	comments = req.body.comments;
	var businessCards = req.body.businessCards;
	var privateMessages = req.body.privateMessages;
	var e_savedProfile = req.body.e_savedProfile;
	var	e_comments = req.body.e_comments;
	var e_businessCards = req.body.e_businessCards;
	var e_privateMessages = req.body.e_privateMessages;


	var query = {
		_id : mongoose.Types.ObjectId(user_id)
	}

	/*if(messages == 1){
		messages = true;
	}else{
		messages = false;
	}

	if(savedProfile == 1){
		savedProfile = true;
	}else{
		savedProfile = false;
	}

	if(comments == 1){
		comments = true;
	}else{
		comments = false;
	}

	if(businessCards == 1){
		businessCards = true;
	}else{
		businessCards = false;
	}

	if(privateMessages == 1){
		privateMessages = true;
	}else{
		privateMessages = false;
	}
	if(e_savedProfile == 1){
		e_savedProfile = true;
	}else{
		e_savedProfile = false;
	}

	if(e_comments == 1){
		e_comments = true;
	}else{
		e_comments = false;
	}

	if(e_businessCards == 1){
		e_businessCards = true;
	}else{
		e_businessCards = false;
	}

	if(e_privateMessages == 1){
		e_privateMessages = true;
	}else{
		e_privateMessages = false;
	}*/


	var updatedValues = {
		"messages" : messages,
		"savedProfile" : savedProfile,
		"comments" : comments,
		"businessCards" : businessCards,
		"privateMessages" : privateMessages
	}

	var updatedValuesEmail = {
		"savedProfile" : e_savedProfile,
		"comments" : e_comments,
		"businessCards" : e_businessCards,
		"privateMessages" : e_privateMessages
	}

	models.User.findOne(query).exec(function (err, user){
		if (user) {

			models.User.update(query, {$set : {"notification.mobile" : updatedValues , "notification.email" : updatedValuesEmail}}, function (err){

				user.notification.mobile = updatedValues;
				user.notification.email = updatedValuesEmail;
				res.format({
					json: function() {
						res.send({
							status : 200,
							updateStatus : "OK",
							user : user
						});
					}
				});
				return;
			});
		}else{
			res.format({
				json: function() {
					res.send({
						status : 404,
						message : "Invalid Information",
						err : err
					});
				}
			});
			return;
		}
	});
}




function privacysettings(req, res){
	var user_id = req.body._id;
	var showProfile = req.body.showProfile;
	var allowLocation = req.body.allowLocation;
	var	allowWall = req.body.allowWall;
	var allowPM = req.body.allowPM;

	var query = {
		_id : mongoose.Types.ObjectId(user_id)
	}

	/*if(showProfile == 1){
		showProfile = true;
	}else{
		showProfile = false;
	}

	if(allowLocation == 1){
		allowLocation = true;
	}else{
		allowLocation = false;
	}

	if(allowWall == 1){
		allowWall = true;
	}else{
		allowWall = false;
	}

	if(allowPM == 1){
		allowPM = true;
	}else{
		allowPM = false;
	}*/

	//if(showProfile != '' && allowLocation != '' && allowWall != '' && allowPM != '')

	var updatedValues = {
		"showProfile" : showProfile,
		"allowLocation" : allowLocation,
		"allowWall" : allowWall,
		"allowPM" : allowPM
	}

	models.User.findOne(query).exec(function (err, user){
		if (user) {

			models.User.update(query, {$set : {privacy : updatedValues}}, function (err){

				user.privacy = updatedValues;
				res.format({
					json: function() {
						res.send({
							status : 200,
							updateStatus : "OK",
							user : user
						});
					}
				});
				return;
			});
		}else{
			res.format({
				json: function() {
					res.send({
						status : 404,
						message : "Invalid Information",
						err : err
					});
				}
			});
			return;
		}
	});
}
