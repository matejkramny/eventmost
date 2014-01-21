var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	price: { type: Number, required: true },
	quantity: { type: Number, required: true },
	type: { type: String, required: true },
	customType: { type: String, required: false },
	whopays: { type: String, required: true },
	start: { type: Date },
	end: { type: Date }
})

exports.Ticket = mongoose.model("Ticket", scheme);