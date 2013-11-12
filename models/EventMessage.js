var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	posted: { type: Date, default: Date.now },
	attendee: {
		type: ObjectId,
		ref: 'Attendee'
	},
	spam: { type: Boolean, default: false },
	message: String
})

exports.EventMessage = mongoose.model("EventMessage", scheme);