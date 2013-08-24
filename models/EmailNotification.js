var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var emailNotification = schema({
	to: {
		type: ObjectId,
		ref: 'User'
	},
	email: String,
	type: String,
	created: { type: Date, default: Date.now }
})

exports.EmailNotification = mongoose.model('EmailNotification', emailNotification)