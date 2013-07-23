var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	title: String,
	body: String,
	created: Date,
	modified: Date,
	user: {
		type: ObjectId,
		ref: 'User'
	},
	event: {
		type: ObjectId,
		ref: 'Event'
	}
})

exports.Note = mongoose.model("Note", scheme);