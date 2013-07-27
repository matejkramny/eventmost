var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	name: String,
	created: { type: Date, default: Date.now },
	start: Date,
	end: Date,
	user: {
		type: ObjectId,
		ref: 'User'
	},
	description: String,
	avatar: String,
	location: {
		lat: { type: Number },
		lng: { type: Number },
		address: String,
	},
	geolocation: Boolean,
	password: {
		enabled: { type: Boolean, default: false },
		password: String
	},
	settings: {
		allowPublicComments: { type: Boolean, default: true },
		allowCommunicationAttendee: { type: Boolean, default: true },
		allowCommunicationSpeaker: { type: Boolean, default: true },
		moderatePublicComments: { type: Boolean, default: false },
		allowForumComments: { type: Boolean, default: true },
		moderateForumComments: { type: Boolean, default: false },
		upload: { type: Boolean, default: true }
	},
	defaultTweet: String
})
scheme.index({
	location: '2d'
})

exports.Event = mongoose.model("Event", scheme);