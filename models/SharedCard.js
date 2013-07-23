var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	user: {
		type: ObjectId,
		ref: 'User'
	},
	card: {
		type: ObjectId,
		ref: 'Card'
	},
	sender: {
		type: ObjectId,
		ref: 'User'
	},
	created: Date
})

exports.SharedCard = mongoose.model("SharedCard", scheme);