var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;
var fs = require('fs');
var config = require('../config');
var gm = require('gm');
var async = require('async');

var scheme = schema({
	url: String,
	backgroundFlag: Boolean,
	createdBy: { type: ObjectId, ref: 'User' },
	created: { type: Date, default: Date.now }
});

scheme.methods.doUpload = function(avatar, cb, size) {
	console.log("hello avatar");
	var self = this;
	if (avatar != null && avatar.name.length != 0) {
		var type = avatar.type;
		if (typeof type === "undefined" || type == null) {
			type = avatar.headers['content-type'];
		}
		
		var ext;
		if (typeof type === "undefined" || type == null) {
			ext = avatar.name.split('.');
		} else {
			ext = type.split('/');
		}
		
		if (ext.length > 0) {
			ext = ext[ext.length-1];
		} else {
			// bad file
			cb("Bad file type");
			return;
		}
		
		// Check against valid extensions
		if (!(ext == 'jpg' || ext == 'jpeg' || ext == 'png' || ext == 'gif')) {
			// valid.
			cb("Invalid file");
			return;
		}
		
		self.url = "/avatars/"+this._id+"."+ext;
		console.log(config.path + "/public" + self.url);
		var callback = function(err) {
			if (err) throw err;

			if (config.knox) {

				config.knox.putFile(config.path + "/public" + self.url, "/public"+self.url, function(err, res) {
					if (err) throw err;
					
					console.log("Uploaded Avatar to S3");
					res.resume();
				})
			}
			
			cb(null);
		}

		if (typeof size === 'undefined' || size == null) {
			fs.rename(avatar.path, config.path + "/public" + self.url, callback);
		} else {
			gm(avatar.path)
				.crop(size.w, size.h, size.x, size.y)
				.write(config.path + "/public" + self.url, callback);
		}
		
		return;
	} else {
		cb(null);
	}
}

scheme.methods.createThumbnails = function(callback) {
	var u = this;
	
	if (!u.url || u.url.substr(u.url.length-3, u.url.length-1) == 'svg') {
		console.log("[ERR]\t".red, "Blank/Invalid avatar!")
		
		callback();
		return;
	}

	var pub = config.path+"/public";
	
	var cb = function() {
		console.log("[OK]\t".green, "Converting "+u.url);
		
		async.parallel([
			function(cb) {
				// Circle-size images first
				gm(pub+u.url).gravity('Center').thumb(116, 116, pub+u.url+"-116x116.png", 100, function(err) {
					if (err) {
						console.log("[ERR]\t".red, "Error Thumbnail with ", pub+u.url);
						cb(err);
					} else {
						if (config.knox) {
							config.knox.putFile(pub+u.url+"-116x116.png", "/public"+u.url+"-116x116.png", function(err, res) {
								if (err) throw err;
								
								console.log("-116x116.png uploaded");
								res.resume();
							})
						}
						
						console.log("[DONE]\t".green, "Converted 116x116")
						cb(null);
					}
				});
			},
			function(cb) {
				// Homepage-size
				gm(pub+u.url).gravity('Center').thumb(285, 148, pub+u.url+"-285x148.png", 100, function(err) {
					if (err) {
						console.log("[ERR]\t".red, "Error Creating Circle with ", pub+u.url);
						cb(err);
					} else {
						if (config.knox) {
							config.knox.putFile(pub+u.url+"-285x148.png", "/public"+u.url+"-285x148.png", function(err, res) {
								if (err) throw err;
								
								console.log("-285x148.png uploaded to S3");
								res.resume();
							})
						}
						
						console.log("[DONE]\t".green, "Converted 285x148")
						cb(null);
					}
				});
			}
		], function(err) {
			if (err) {
				console.log("[ERR]\t".red, "Thumbnail Creation Failed!", pub+u.url);
			} else {
				console.log("[DONE]\t".green, "Converted "+u._id);
			}
			
			callback()
		})
	}
	
	// if is url, download it (in other words, if it !begins with /avatars/_id.ext then DL and replace)
	if (u.url.substring(0, 1) != "/") {
		console.log("[OK]\t".green, "Downloading "+u.url);
		request(u.url, function(err, incoming, response) {
			if (err) throw err;
			
			//404 protection..
			if (incoming.statusCode != 200) {
				//Code later assumes default avatar
				console.log("[ERR]\t".red, incoming.statusCode.bold, " Download failed!");
				u.url = "";
				
				callback();
				return;
			}
			
			u.url = "/avatars/"+u._id;
			
			if (config.knox) {
				config.knox.putFile(pub+"/avatars/"+u._id, "/avatars/"+u._id, function(err, res) {
					if (err) throw err;
					
					console.log("Uploading a downloaded img");
					res.resume();
				})
			}
			
			cb();
		}).pipe(fs.createWriteStream(pub+"/avatars/"+u._id));
	} else {
		cb();
	}
}

exports.Avatar = mongoose.model("Avatar", scheme);