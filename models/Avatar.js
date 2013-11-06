var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;
var fs = require('fs')

var scheme = schema({
	url: String,
	createdBy: { type: ObjectId, ref: 'User' },
	created: { type: Date, default: Date.now }
});

scheme.methods.doUpload = function(files, cb) {
	var self = this;
	if (files.avatar != null && files.avatar.name.length != 0) {
		var type = files.avatar.type;
		if (typeof type === "undefined" || type == null) {
			type = files.avatar.headers['content-type'];
		}
		
		var ext;
		if (typeof type === "undefined" || type == null) {
			ext = files.avatar.name.split('.');
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
		
		fs.readFile(files.avatar.path, function(err, avatar) {
			fs.writeFile(__dirname + "/../public"+self.url, avatar, function(err) {
				if (err) throw err;
				
				cb(null);
			});
		});
		
		return;
	} else {
		cb(null);
	}
}

exports.Avatar = mongoose.model("Avatar", scheme);