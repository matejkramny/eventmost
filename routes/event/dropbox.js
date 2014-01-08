var models = require('../../models'),
	fs = require('fs'),
	attending = require('./event').attending,
	config = require('../../config'),
	gm = require('gm'),
	imageMagick = gm.subClass({ imageMagick: true });

exports.router = function (app) {
	app.get('/event/:id/dropbox', view)
		.post('/event/:id/dropbox', saveDropbox)
		.post('/event/:id/dropbox/upload', doUpload)
		.get('/event/:id/dropbox/:fid/remove', doRemove)
}

function view (req, res) {
	if (!res.locals.eventattending) {
		res.format({
			html: function() {
				res.redirect('/event/'+res.locals.ev._id);
			},
			json: function() {
				res.send({
					status: 403,
					message: "Not attending"
				})
			}
		})
		
		return;
	}
	
	res.format({
		html: function() {
			res.render('event/dropbox', { title: "Dropbox" })
		}
	})
}

function doRemove (req, res, next) {
	var id = req.params.fid;
	var ev = res.locals.ev;
	var isPlanner = res.locals.eventadmin;
	
	try {
		id = mongoose.Types.ObjectId(id);
	} catch (e) {
		req.session.flash.push("Bad File ID")
		res.redirect('/event/'+ev._id);
		return;
	}
	
	if (!isPlanner) {
		req.session.flash.push("Unauthorized")
		res.redirect('/event/'+ev._id);
		return;
	}
	
	// no files check
	if (!ev.files || ev.files.length == 0) {
		res.redirect('/event/'+ev._id+'/dropbox')
		return;
	}
	
	// check which file to remove (id'd by filepath.. they are essentially unique)
	for (var i = 0; i < ev.files.length; i++) {
		var f = ev.files[i];
		
		if (f._id && f._id.equals(id)) {
			// Remove this file
			ev.files.splice(i, 1);
			
			try {
				fs.unlink(config.path+"/public"+f.file)
			} catch (e) {
				console.log("Failed to delete dropbox file..");
			}
			
			break;
		}
	}
	
	ev.save(function(err) {
		if (err) throw err;
	})
	res.format({
		html: function() {
			req.session.flash.push("Dropbox File Removed");
			res.redirect('/event/'+ev._id+'/dropbox')
		},
		json: function() {
			res.send({
				status: 200,
				message: "Removed"
			})
		}
	})
}

function saveDropbox (req, res) {
	if (!res.locals.eventadmin) {
		res.format({
			html: function() {
				res.redirect('back');
			},
			json: function() {
				res.send({
					status: 403,
					message: "Not Admin"
				})
			}
		})
		
		return;
	}
	
	var ev = res.locals.ev;
	
	try {
		var pid = mongoose.Types.ObjectId(req.body.file);
		
		var found = false;
		var file;
		for (var i = 0; i < ev.files.length; i++) {
			if (ev.files[i]._id.equals(pid)) {
				found = true;
				file = ev.files[i]
				break;
			}
		}
		
		if (found) {
			var perms = JSON.parse(req.body.permissions);
			
			file.permissions.all = perms.all;
			file.permissions.categories = perms.categories;
		}
	} catch (e) {
		throw e;
	}
	
	ev.allowDropboxUpload = req.body.allowDropboxUpload == 'yes' ? true : false;
	ev.save()
	
	req.session.flash = ["Dropbox Settings Updated"]
	res.format({
		html: function() {
			res.redirect('back')
		},
		json: function() {
			res.send({
				status: 200,
				message: "Saved"
			})
		}
	})
}

function doUpload (req, res) {
	//TODO check attendee(s) can upload files
	if (!res.locals.eventattending) {
		res.format({
			html: function() {
				res.redirect('/event/'+res.locals.ev._id);
			},
			json: function() {
				res.send({
					status: 403,
					message: "Not attending"
				})
			}
		})
		
		return;
	}
	
	var ev = res.locals.ev;
	
	if (req.files.upload == null || req.files.upload.name.length == 0) {
		res.format({
			html: function() {
				req.session.flash.push("No file");
				res.redirect('/event/'+ev._id+"/dropbox");
			},
			json: function() {
				res.send({
					status: 403,
					message: "No file"
				});
			}
		})
		
		return;
	}
	
	var ext = req.files.upload.name.split('.');
	var extValid = false;
	if (ext.length != 0) {
		// Last . is extension
		var ext = ext[ext.length-1];
		// Check if its valid
		// no executables
		if (ext.length != 0 && ext != "exe") {
			extValid = true;
		}
	}
	
	if (!extValid) {
		// Invalid extension, deny upload
		res.format({
			html: function() {
				req.session.flash.push("Invalid extension")
				res.redirect('/event/'+ev._id+'/dropbox')
			},
			json: function() {
				res.send({
					status: 403,
					message: "Invalid extension"
				})
			}
		})
		// TODO delete the file? [maybe done automatically]
		return;
	}
	
	var timestamp = Date.now();
	var file = {
		file: "/dropbox/"+ev._id+""+timestamp+"."+ext,
		fileThumb: "/dropbox/"+ev._id+""+timestamp+"-thumb.png",
		extension: ext,
		user: req.user._id,
		created: Date.now(),
		name: req.files.upload.name
	}
	
	fs.readFile(req.files.upload.path, function(err, upload) {
		fs.writeFile(config.path+"/public"+file.file, upload, function(err) {
			if (err) throw err;
			
			// Calculate the size of the file
			file.size = upload.length / 1024
			if (file.size > 1024) {
				file.size /= 1024;
				file.size = Math.floor(file.size) + "mb"
			} else {
				file.size = Math.floor(file.size) + "kb"
			}
			
			//Create thumbnail
			if (ext == 'jpg' || ext == 'jpeg' || ext == 'png' || ext == 'gif') {
				imageMagick(config.path+"/public"+file.file).resize(205, 154).write(config.path+"/public"+file.fileThumb, function(err) {
					if (err) throw err;
				})
			} else if (ext == 'pdf') {
				imageMagick(config.path+"/public"+file.file+"[0]").adjoin().resize(205, 154).write(config.path+"/public"+file.fileThumb, function(err) {
					if (err) throw err;
				})
			}
			
			if (ev.files == null) {
				ev.files = []
			}
			
			ev.files.splice(0,0, file);
			
			ev.save(function(err) {
				if (err) throw err;
			});
			
			res.format({
				html: function() {
					req.session.flash.push("File Uploaded")
					res.redirect('/event/'+ev._id+"/dropbox")
				},
				json: function() {
					req.session.flash.push("File Uploaded")
					res.send({
						status: 200,
						message: 'Uploaded'
					})
				}
			})
		});
	});
}