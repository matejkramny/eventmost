var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;
var crypto = require('crypto')

var scheme = schema({
	created: { type: Date, default: Date.now },
	user: { type: ObjectId, ref: 'User' },
	hash: String,
	used: { type: Boolean, default: false }
})

scheme.methods.generateHash = function () {
	var seed = crypto.randomBytes(20);
	this.hash = crypto.createHash('sha1').update(seed).digest('hex');
}

exports.PasswordReset = mongoose.model("PasswordReset", scheme);