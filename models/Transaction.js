var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	tickets: [{
		price: { type: Number, required: true },
		fees: Number,
		quantity: { type: Number, required: true },
		name: { type: String, required: true },
		ticket: { type: ObjectId, ref: 'Ticket' }
	}],
	method: String, //paypal | stripe
	total: Number, //what user got charged
	profit: Number, //what EM get
	planner: Number, //what planner gets
	third_party: Number, //fees paid to 3rd party (method ^)
	user: { type: ObjectId, ref: 'User' },
	event: { type: ObjectId, ref: 'Event' },
	created: { type: Date, default: Date.now },
	status: { type: String, default: 'pending' }, // complete | cancelled | pending | failed
	details: String, // additional details
	payment_id: String //payment id
})

exports.Transaction = mongoose.model("Transaction", scheme);