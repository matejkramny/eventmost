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
	message: {
		type: ObjectId,
		ref: 'Message'
	}
});

exports.Attendee = mongoose.model("Attendee", scheme);