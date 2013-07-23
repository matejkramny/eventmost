var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	user: {
		type: ObjectId,
		ref: 'User'
	},
	name: String,
	surname: String,
	address: String,
	zip: String,
	city: String,
	picture: String,
	phone: String,
	email: String,
	twitter: String,
	website: String,
	position: String,
	card_type: {
		type: ObjectId,
		ref: 'CardType'
	},
	deleted: Date
});

exports.Card = mongoose.model("Card", scheme);