var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	created: Date,
	user: {
		type: ObjectId,
		ref: 'User'
	},
	topic: {
		type: ObjectId,
		ref: 'Topic'
	},
	moderated: Boolean,
	public: Boolean,
	forum: Boolean,
	message: String,
	read: Boolean
})

exports.Message = mongoose.model("Message", scheme);