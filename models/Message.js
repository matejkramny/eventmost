var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	topic: {
		type: ObjectId,
		ref: "Topic"
	},
	message: String,
	read: Boolean,
	timeSent: Date,
	sentBy: {
		type: ObjectId,
		ref: 'User'
	}
})

exports.Message = mongoose.model("Message", scheme);