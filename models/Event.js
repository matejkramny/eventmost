var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	created: Date,
	start: Date,
	end: Date,
	user: {
		type: ObjectId,
		ref: 'User'
	},
	description: String,
	avatar: String,
	location: {
		lat: Number,
		lng: Number,
		address: String
	},
	geolocation: Boolean,
	password: {
		enabled: Boolean,
		password: String
	},
	settings: {
		allowPublicComments: Boolean,
		allowCommunicationAttendee: Boolean,
		allowCommunicationSpeaker: Boolean,
		moderatePublicComments: Boolean,
		allowForumComments: Boolean,
		moderateForumComments: Boolean,
		upload: Boolean
	},
	defaultTweet: String
})

exports.Event = mongoose.model("Event", scheme);