var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	type: { type: String, required: true, enum: ["impression", "pm", "comment", "wallComment", "savedProfile", "sentBusinessCard"] },
	created: { type: Date, default: Date.now },
	location: { type: String }, // 'landingpage', 'attendees' etc...
	attendee: { type: ObjectId, ref: 'Attendee' },
	attending: { type: Boolean, default: false },
	isAdmin: { type: Boolean, default: false },
	event: { type: ObjectId, ref: 'Event' }
})

exports.EventStat = mongoose.model("EventStat", scheme);