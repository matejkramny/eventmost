var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	event: {
		type: ObjectId,
		ref: 'Event'
	},
	user: {
		type: ObjectId,
		ref: 'User'
	},
	planner: Boolean,
	message: {
		type: ObjectId,
		ref: 'Message'
	}
})

exports.Speaker = mongoose.model("Speaker", scheme);