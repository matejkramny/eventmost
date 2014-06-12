var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;
var fs = require('fs')
var config = require('../config')
var gm = require('gm')

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

exports.Avatar = mongoose.model("Avatar", scheme);