var models = require('../../models'),
	fs = require('fs')
	util = require('../../util')

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
			createdBy: req.user._id
	   	});
		avatar.doUpload(req.files.avatar, doCallback)
	} else {
		models.Avatar.findOne(avatarid, function(av) {
			// TODO warning possible hackable area (specify avatar id, and upload an image. it should overwrite it)
			if (!av) {
				// Make a new avatar
				av = new models.Avatar({
					createdBy: req.user._id
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
					fs.unlink(__dirname + "/../../public" + avatar.url)
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
