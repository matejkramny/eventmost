var models = require('../../../../models'),
	fs = require('fs'),
	attending = require('./apievent').attending,
	config = require('../../../../config'),
	gm = require('gm'),
	moment = require('moment'),
	mongoose = require('mongoose'),
	async = require('async')

exports.router = function (app) {
	app.get('/api/event/:id/dropbox', viewDropboxAPI)
		.post('/api/event/:id/dropbox', saveDropbox)
		.post('/api/event/:id/dropbox/upload', doUploadAPI)
		.get('/api/event/:id/dropbox/:fid/remove', doRemove)
}

function viewDropboxAPI(req, res) {
	console.log("View Drop Box API");

	var event_id = req.params.id;
	models.Event.findById(event_id, function (err, ev) {


		var fileslist = [];

		if (ev && ev.files.length > 0) {

			//tis a callback hell
			var count = 0;

			ev.files.forEach(function (thisFile) {
				models.User.findOne({"_id": thisFile.user}, function (err, user) {

					fileslist.push({
						file: thisFile.file,
						fileThumb: thisFile.fileThumb,
						extension: thisFile.extension,
						user: {
							id: user._id,
							fullname: user.getName()
						},
						name: thisFile.name,
						size: thisFile.size,
						_id: thisFile._id,
						permissions: thisFile.permissions,
						created: thisFile.created

					});

					if (++count == ev.files.length) {

						res.format({
							json: function () {
								res.send({
									status: 200,
									files: fileslist
								})
							}
						})
					}

				})
			})

		} else {
			res.format({
				json: function () {
					res.send({
						status: 404,
						message: 'No File Found!'
					})
				}
			})
		}

	});
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
	
	// check which file to remove (id'd by filepath.. they are essentially unique)
	var found = -1;
	for (var i = 0; i < ev.files.length; i++) {
		var f = ev.files[i];
		
		if (f._id && f._id.equals(id)) {
			found = i;
			break;
		}
	}
	
	if (found == -1) {
		res.redirect('/event/'+ev._id+'/dropbox')
		return;
	}
	
	models.Event.findById(ev._id, function(err, ev) {
		if (isPlanner || (ev.files[found].user && ev.files[found].user._id && ev.files[found].user._id.equals(req.user._id))) {
			console.log(ev);
			console.log(found);
			console.log(ev.files[found].file);
			try {
				fs.unlink(config.path+"/public"+ev.files[found].file)
				
				if (config.knox) {
					config.knox.deleteFile("/public"+ev.files[found].file, function(err, res) {
						if (err) throw err;
						
						console.log("Unlinked Dropbox file from S3")
						res.resume();
					});
					config.knox.deleteFile("/public"+ev.files[found].fileThumb, function(err, res) {
						if (err) throw err;
						
						console.log("Unlinked Dropbox Thumbnail file from S3")
						res.resume();
					});
				}
			} catch (e) {
				console.log("Failed to delete dropbox file.."+e.message);
				console.log(e.stack);
			}
			
			// Remove this file
			ev.files.splice(found, 1);
		} else {
			req.session.flash.push("Unauthorized")
			res.redirect('/event/'+ev._id);
			return;
		}
	
		ev.save(function(err) {
			if (err) throw err;
		})
		res.format({
			json: function() {
				res.send({
					status: 200,
					message: "Removed"
				})
			}
		})
	});
}

function saveDropbox (req, res) {
	var ev = res.locals.ev;
	
	var found = false;
	var file;
	
	models.Event.findById(ev._id, function(err, ev) {
		try {
			var pid = mongoose.Types.ObjectId(req.body.file);
		
			for (var i = 0; i < ev.files.length; i++) {
				if (ev.files[i]._id.equals(pid)) {
					found = true;
					file = ev.files[i]
					break;
				}
			}
		} catch (e) {
			throw e;
			res.format({
				json: function() {
					res.send({
						status: 404
					})
				}
			});
		
			return;
		}
	
		if (!(res.locals.eventadmin || (file.user && file.user._id && file.user._id.equals(req.user._id)))) {
			res.format({
				json: function() {
					res.send({
						status: 404
					})
				}
			})
		
			return;
		}
	
		try {
			if (found) {
				var perms = JSON.parse(req.body.permissions);
			
				file.permissions.all = perms.all;
				file.permissions.categories = perms.categories;
			}
		} catch (e) {
			throw e;
		}
	
		if (res.locals.eventadmin && typeof req.body.allowDropboxUpload !== 'undefined' && req.body.allowDropboxUpload.length > 0) {
			ev.allowDropboxUpload = req.body.allowDropboxUpload == 'yes' ? true : false;
		}
		ev.save()
	
		req.session.flash = ["Dropbox Settings Updated"]
		res.format({
			json: function() {
				res.send({
					status: 200,
					message: "Saved"
				})
			}
		})
	});
}

function doUploadAPI (req, res) {
	
	//console.log("------Upload File--------".red);
	console.log(req.body);
	console.log(req.files);
	
	console.log("Config PATH " + config.path);
	
	var event_id = req.params.id;
	var user_id = req.body.userid;

	if(!user_id){
		res.format({
			json: function() {
				res.send({
					status: 403,
					message: "user id missing"
				})
			}
		})
	}

	console.log("Verify File Extension".red);
	
	var ext = req.files.uploadedfile.name.split('.');
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
	
	console.log("Extension is Ok".red);
	
	ext = ext.toLowerCase();
	
	var timestamp = Date.now();
	var file = {
		file: "/dropbox/"+event_id+""+timestamp+"."+ext,
		fileThumb: "/dropbox/"+event_id+""+timestamp+"-thumb." + ext,
		extension: ext,
		user: user_id,
		created: Date.now(),
		name: req.files.uploadedfile.name
	}
	
	console.log("Created New File".red);
	
	fs.rename(req.files.uploadedfile.path, config.path+"/public"+file.file, function(err) {
		if (err) 
		{
			console.log(err);
			throw err;
		}
		
		console.log("Fs - Rename is Good".red);
		console.log("config.PATH : ".red  + config.path+"/public"+file.file);
		console.log("/public + file.file : ".red + "/public"+file.file);
		
		
		if (config.knox != null) {
			config.knox.putFile(config.path+"/public"+file.file, "/public"+file.file, function(err, res) {
				if (err)
				{
					console.log("KNOX - Put File Error ".red + err);
					throw err;
				}
				console.log("Dropbox File Uploaded");
				//res.resume();
			});
		}
		
		fs.stat(config.path+"/public"+file.file, function(err, stat) {
			if (err) throw err;
			
			// Calculate the size of the file
			file.size = stat.size / 1024
			if (file.size > 1024) {
				file.size /= 1024;
				file.size = Math.floor(file.size) + "mb"
			} else {
				file.size = Math.floor(file.size) + "kb"
			}
		
			console.log(config.path+"/public"+file.file);
			console.log(config.path+"/public"+file.fileThumb);
			
			//Create thumbnail
			if (ext == 'jpg' || ext == 'jpeg' || ext == 'png' || ext == 'gif') {
				gm(config.path+"/public"+file.file).gravity('Center').thumb(205, 154, config.path+"/public"+file.fileThumb, 100, function(err) {
					if (err)
					{
						console.log("gm error ".red + err); 
						throw err;
					}
					if (config.knox != null) {
						config.knox.putFile(config.path+"/public"+file.fileThumb, "/public"+file.fileThumb, function(err, res) {
							if (err) throw err;
							
							console.log("Dropbox File Thumbnail Uploaded");
							//res.resume();
						});
					}
				})
			} else if (ext == 'pdf') {
				gm(config.path+"/public"+file.file+"[0]").adjoin().gravity('Center').thumb(205, 154, config.path+"/public"+file.fileThumb, 100, function(err) {
					if (err) throw err;
					
					if (config.knox != null) {
						config.knox.putFile(config.path+"/public"+file.fileThumb, "/public"+file.fileThumb, function(err, res) {
							if (err) throw err;
							
							console.log("Dropbox File Thumbnail Uploaded");
							res.resume();
						});
					}
				})
			}
		
			
		
			models.Event.findById(event_id, function(err, ev) {
				
				if (ev.files == null) {
				ev.files = []
			}
				
				ev.files.splice(0,0, file);
		
				ev.save(function(err) {
					if (err) throw err;
				});
			});
		
			res.format({
				json: function() {
					req.session.flash.push("File Uploaded")
					res.send({
						status: 200,
						message: 'Uploaded'
					})
				}
			})
		})
	})
}
