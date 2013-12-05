var mongoose = require('mongoose');
var crypto = require('crypto')

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	created: {
		type: Date,
		default: Date.now
	},
	user: { // User its being sent to..
		type: ObjectId,
		ref: 'User'
	},
	email: String, // user || email must be present
	requestedBy: { // Who requested this
		type: ObjectId,
		ref: 'User'
	},
	takeoverUser: { // The user that is being taken over.. Possibly a Feedback profile
		type: ObjectId,
		ref: 'User'
	},
	event: { // Which event is this on
		type: ObjectId,
		ref: 'Event'
	},
	secret: {
		type: String
	},
	active: {
		type: Boolean,
		default: true
	},
	wasIgnored: {
		type: Boolean,
		default: false
	},
	wasAccepted: {
		type: Boolean,
		default: false
	},
	actionTaken: Date
})

scheme.methods.generateSecret = function () {
	var s = crypto.randomBytes(20);
	this.secret = crypto.createHash('sha1').update(s).digest('hex');
}

exports.UserTakeoverRequest = mongoose.model("UserTakeoverRequest", scheme);