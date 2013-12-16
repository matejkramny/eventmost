var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	posted: { type: Date, default: Date.now }, //when posted
	attendee: { // posted by
		type: ObjectId,
		ref: 'Attendee'
	},
	spam: { type: Boolean, default: false }, // mark as spam, won't show
	message: String, // comment message
	isResponse: { type: Boolean, default: false }, //if true, won't show as top-level message
	likes: [{ // people who liked it
		type: ObjectId,
		ref: 'Attendee'
	}],
	comments: [{ // comments on this comment (must have isResponse:true)
		type: ObjectId,
		ref: 'EventMessage'
	}]
})

exports.EventMessage = mongoose.model("EventMessage", scheme);