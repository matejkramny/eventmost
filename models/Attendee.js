var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	user: {
		type: ObjectId,
		ref: 'User'
	},
	category: String,
	admin: { type: Boolean, default: false },
	isAttending: { type: Boolean, default: true }, // gets set to false when the user exits the event..
	ticket: { type: ObjectId, ref: 'Ticket' }
})

exports.Attendee = mongoose.model("Attendee", scheme);