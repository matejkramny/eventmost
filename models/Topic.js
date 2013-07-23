var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	event: {
		type: ObjectId,
		ref: 'Event'
	},
	publicUser: {
		type: ObjectId,
		ref: 'User'
	},
	user1: {
		type: ObjectId,
		ref: 'User'
	},
	user2: {
		type: ObjectId,
		ref: 'User'
	},
	message: {
		type: ObjectId,
		ref: 'Message'
	},
})

exports.Topic = mongoose.model("Topic", scheme);