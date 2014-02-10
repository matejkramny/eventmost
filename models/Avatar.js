var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;
var fs = require('fs')
var config = require('../config')

var scheme = schema({
	url: String,
	createdBy: { type: ObjectId, ref: 'User' },
	created: { type: Date, default: Date.now }
});

scheme.methods.doUpload = function(avatar, cb) {
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
		
		fs.rename(avatar.path, config.path + "/public" + self.url, function(err) {
			if (err) throw err;
			
			if (config.knox) {
				config.knox.putFile(config.path + "/public" + self.url, "/public"+self.url, function(err, res) {
					if (err) throw err;
					
					console.log("Uploaded Avatar to S3");
					res.resume();
				})
			}
			
			cb(null);
		})
		
		return;
	} else {
		cb(null);
	}
}

exports.Avatar = mongoose.model("Avatar", scheme);