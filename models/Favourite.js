var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	user: {
		type: ObjectId,
		ref: 'User'
	},
	favourited_user: {
		type: ObjectId,
		ref: 'User'
	},
	event: {
		type: ObjectId,
		ref: 'Event'
	}
})

exports.Favourite = mongoose.model("Favourite", scheme);