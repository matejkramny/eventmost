var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	tickets: [{
		price: Number,
		fees: Number,
		quantity: Number,
		name: String,
		ticket: { type: ObjectId, ref: 'Ticket' },
		promo: {
			code: String,
			discount: Number
		}
	}],
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