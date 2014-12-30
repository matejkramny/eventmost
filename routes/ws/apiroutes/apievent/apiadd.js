var models = require('../../../../models'),
	fs = require('fs'),
	util = require('../../util'),
	config = require('../../../../config')

exports.router = function (app) {
	app.get('/api/event/add', util.authorized, addEventAPI)
		.post('/api/event/add', util.authorized, doAddEventAPI)
		.post('/api/event/add/avatar', uploadAvatarAsync)
		.get('/api/event/:avatarid/avatar/remove', util.authorized, removeAvatar)
}

function addEventAPI (req, res) {
	res.render('event/add', { title: "Add Event" })
}

function doAddEventAPI (req, res) {
	
	//console.log("/api/event/add".red);
	//console.log("##############".red);
	//console.log(req.body);
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
						status: 400,
						err: err
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
	var avatarid = req.body.avatarid;
	var userid = req.body.userid;
	var avatar;
	
	function doCallback (err) {
		if (err) {
			res.send({
				status: 400,
				err: err
			});
		}
		
		// Do magic
		avatar.save(function(err) {
			if (err) throw err;
			
			res.send({
				status: 200,
				id: avatar._id
			});
		});
	}
	
	if (!avatarid) {
		avatar = new models.Avatar({
			createdBy: userid
   	});
		avatar.doUpload(req.files.avatar, doCallback)
	} else {
		models.Avatar.findOne(avatarid, function(av) {
			// TODO warning possible hackable area (specify avatar id, and upload an image. it should overwrite it)
			if (!av) {
				// Make a new avatar
				av = new models.Avatar({
					createdBy: userid
				});
			}
			
			avatar = av;
			av.doUpload(req.files.avatar, doCallback)
		})
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
			status: 400,
			err: "ID Invalid"
		})
		return;
	}
}
