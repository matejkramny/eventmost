var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var contact = schema({
	subject: String,
	message: String,
	created: { type: Date, default: Date.now() }
})

exports.Contact = mongoose.model('Contact', contact)