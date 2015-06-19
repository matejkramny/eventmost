var models = require('../../../../models'),
	fs = require('fs'),
	util = require('../../util'),
	config = require('../../../../config'),
	mongoose = require('mongoose')

exports.router = function (app) {
	app.get('/api/event/add', util.authorized, addEventAPI)
	.post('/api/event/add', util.authorized, doAddEventAPI)
	.post('/api/event/add/avatar', uploadAvatarAsync)
	.get('/api/event/:avatarid/avatar/remove', removeAvatar)
}

function addEventAPI (req, res) {
	res.render('event/add', { title: "Add Event" })
}

function doAddEventAPI (req, res) {
	
	//console.log("/api/event/add".red);
	//console.log("##############".red);
	console.log(req.body);
	//console.log("##############".red);
	
	models.User.findById(req.body._id , function(err, user) {
		
	//console.log("##############".red);
	//console.log(user);
	//console.log("##############".red);
	
	var newEvent = new models.Event({});
	
		newEvent.edit(req.body, user, req.files, function(err, ev) {
			if (err && err.length > 0) {
				res.format({
					json: function() {
						res.send({
							status: 404,
							err: "Unable to create event"
						})
					}
				})
				return;
			}
			
			res.format({
				json: function() {
					res.send({
						status: 200,
						id: newEvent._id
					})
				}
			});
		});
	});
}

function uploadAvatarAsync (req, res) {

	if (req.files && req.files.avatar != null && req.files.avatar.name.length != 0) {

		models.Avatar.findOne({_id:req.body._id} , function(err, u) {

			var ext = req.files.avatar.type.split('/');
			var ext = ext[ext.length-1];

			if(!u){
				u = new models.Avatar({
					createdBy: req.body.userid
				});
			}

			var createThumbnails = function() {
				u.createThumbnails(function(){
					u.save();
				});
			}

			u.url = "/avatars/"+u._id+"."+ext;
			

			fs.rename(req.files.avatar.path, config.path + "/public"+u.url, function(err) {
				if (err) throw err;
				
				if (config.knox) {
					config.knox.putFile(config.path + "/public"+u.url, "/public"+u.url, function(err, res) {
						if (err) throw err;
						
						
					})
				}

				createThumbnails();
						
				res.format({
					json: function() {
						res.json({
							status: 200,
							avatar: u._id,
							url: u.url,
							dateCreated: u.created
						})
					}
				});
			});
		});
		
	}else{

		res.format({
			json: function() {
				res.json({
					status: 404,
					message: "No File Received!"
				})
			}
		});
	}
}

function removeAvatar (req, res) {
	var id = req.params.avatarid;
	
	// Find the avatar
	try {
		id = mongoose.Types.ObjectId(id);
		
		models.Avatar.findOne({
			_id: id
		}, function(err, avatar) {
			if (err) throw err;
			
			if (avatar) {
				if (avatar.url && avatar.url.indexOf("http") == -1) {
					fs.unlink(config.path + "/public" + avatar.url)
					if (config.knox) {
						config.knox.deleteFile('/public'+avatar.url, function(err, res) {
							if (err) throw err;
							
							console.log("Unlinked Event Avatar from S3");
							res.resume();
						})
					}
				}
				
				avatar.remove();
			}
			
			res.send({
				status:200
			})
		})
	} catch (ex) {
		res.send({
			status: 401,
			err: "ID Invalid"
		})
		return;
	}
}
