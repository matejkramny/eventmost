var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	user: {
		type: ObjectId,
		ref: 'User'
	},
	avatar: String
})

exports.Upload = mongoose.model("Upload", scheme);