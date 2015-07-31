var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	lastUpdated: Date,
	eventid: {
		type: ObjectId,
		ref: 'Event'
	},
	users: [{
		type: ObjectId,
		ref: 'User'
	}]
})

exports.Topic = mongoose.model("Topic", scheme);