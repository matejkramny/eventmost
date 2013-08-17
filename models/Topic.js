var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	name: String,
	lastUpdated: Date,
	users: [{
		type: ObjectId,
		ref: 'User'
	}]
})

exports.Topic = mongoose.model("Topic", scheme);