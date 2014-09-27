var models = require('../../models'),
	fs = require('fs'),
	util = require('../../util'),
	config = require('../../config')

exports.router = function (app) {
	app.get('/event/add', util.authorized, addEvent)
		.post('/event/add', util.authorized, doAddEvent)
		.post('/event/add/avatar', util.authorized, uploadAvatarAsync)
		.get('/event/:avatarid/avatar/remove', util.authorized, removeAvatar)
}

function addEvent (req, res) {
	res.render('event/add', { title: "Add Event" })
}

function doAddEvent (req, res) {
	var newEvent = new models.Event({});
	
	newEvent.edit(req.body, req.user, req.files, function(err, ev) {
		if (err && err.length > 0) {
			res.format({
				html: function() {
					req.session.flash = err;
					res.redirect('/event/add');
				},
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
			html: function() {
				res.redirect('/event/'+newEvent._id);
			},
			json: function() {
				res.send({
					status: 200,
					id: newEvent._id
				})
			}
		});
	});
}

function uploadAvatarAsync (req, res) {
	var avatarid = req.body.avatarid;

	fs.writeFile(config.path+"/data/debug.txt", config.path, function(err) {
		if (err) throw err;
		return;
	})	

	//fs.writeFile(config.path+"/data/debug.txt", avatarid, function(err) {
	//	if (err) throw err;
	//})	

	var avatar;
	var background_image = ((req.body.background_image == 'true')? true: false);
	var size = {
		x: parseFloat(req.body.x),
		y: parseFloat(req.body.y),
		w: parseFloat(req.body.w),
		h: parseFloat(req.body.h)
	}

	for (var s in size) {
		if (size.hasOwnProperty(s)) {
			if (isNaN(size[s])) {
				size = null;
				break;
			}
		}
	}
	
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
			createdBy: req.user._id,
			backgroundFlag: background_image
   	});
		avatar.doUpload(req.files.avatar, doCallback, size)
	} else {
		models.Avatar.findOne(avatarid, function(av) {
			// TODO warning possible hackable area (specify avatar id, and upload an image. it should overwrite it)
			if (!av) {
				// Make a new avatar
				av = new models.Avatar({
					createdBy: req.user._id,
					backgroundFlag: background_image
				});
			}
			
			avatar = av;
			av.doUpload(req.files.avatar, doCallback, size)
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
