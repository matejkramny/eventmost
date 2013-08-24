models = require('../../models')
fs = require('fs')

exports.view = function (req, res) {
	var id = req.params.id;
	
	models.Event.getEvent(id, function(event) {
		res.format({
			html: function() {
				res.render('event/dropbox', { event: event })
			},
			json: function() {
				res.send({
					event: event
				})
			}
		})
	})
}

exports.doRemove = function (req, res, next) {
	var id = req.params.id;
	var filepath = req.body.file;
	
	if (!id) {
		next()
	}
	
	models.Event.getEvent(id, function(ev) {
		if (ev.user == null || !ev.user._id.equals(req.user._id)) {
			req.session.flash.push("Unauthorized")
			res.redirect('/');
			return;
		}
		
		if (!ev || !ev.files || ev.files.length == 0) {
			res.redirect('/event/'+ev._id+'/dropbox')
			return;
		}
		
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
		
			res.redirect('/event/'+ev._id+'/dropbox')
		})
	})
}

exports.doUpload = function (req, res) {
	var id = req.params.id;
	
	models.Event.getEvent(id, function(ev) {
		if (req.files.upload != null && req.files.upload.name.length != 0) {
			var ext = req.files.upload.type.split('/');
			var ext = ext[ext.length-1];
			var file = {
				file: "/dropbox/"+ev._id+"-"+Date.now()+"."+ext,
				user: req.user._id,
				created: Date.now(),
				name: req.files.upload.name
			}
			
			fs.readFile(req.files.upload.path, function(err, upload) {
				fs.writeFile(__dirname + "/../../public/"+file.file, upload, function(err) {
					if (err) throw err;
					
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
						
						res.redirect('/event/'+ev._id+"/dropbox")
					})
				});
			});
		} else {
			res.redirect('/event/'+ev._id+"/dropbox");
		}
	})
}

