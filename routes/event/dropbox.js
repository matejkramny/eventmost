models = require('../../models')
fs = require('fs')

exports.view = function (req, res) {
	if (!res.locals.eventattending) {
		res.format({
			html: function() {
				res.redirect('/event/'+res.locals.event._id);
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
		},
		json: function() {
			res.send({
				event: res.locals.event,
				attending: res.locals.eventattending
			})
		}
	})
}

exports.doRemove = function (req, res, next) {
	var filepath = req.body.file;
	var ev = res.locals.event;
	
	// must be planner of the event
	if (ev.user == null || !ev.user._id.equals(req.user._id)) {
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
	for (file in ev.files) {
		var f = ev.files[file];
	
		if (f.file == filepath) {
			// Remove this file
			ev.files.splice(f, 1);
			break;
		}
	}
	
	ev.save(function(err) {
		if (err) throw err;
	})
	res.format({
		html: function() {
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

exports.doUpload = function (req, res) {
	if (!res.locals.eventattending) {
		res.format({
			html: function() {
				res.redirect('/event/'+res.locals.event._id);
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
	
	var ev = res.locals.event;
	
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
	
	var file = {
		file: "/dropbox/"+ev._id+""+Date.now()+"."+ext,
		user: req.user._id,
		created: Date.now(),
		name: req.files.upload.name
	}
	
	fs.readFile(req.files.upload.path, function(err, upload) {
		fs.writeFile(__dirname + "/../../public/"+file.file, upload, function(err) {
			if (err) throw err;
			
			// Calculate the size of the file
			file.size = upload.length / 1024
			if (file.size > 1024) {
				file.size /= 1024;
				file.size = Math.floor(file.size) + "mb"
			} else {
				file.size = Math.floor(file.size) + "kb"
			}
			
			if (ev.files == null) {
				ev.files = []
			}
			ev.files.push(file);
			ev.save(function(err) {
				if (err) throw err;
			});
			res.redirect('/event/'+ev._id+"/dropbox")
		});
	});
}