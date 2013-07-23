var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	filename: String,
	user: {
		type: ObjectId,
		ref: 'User'
	},
	event: {
		type: ObjectId,
		ref: 'Event'
	},
	size: Number,
	created: Date,
	type: String
})

exports.UserFile = mongoose.model("UserFile", scheme);