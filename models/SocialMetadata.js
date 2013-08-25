var mongoose = require('mongoose')

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

// Data is collected because can be useful in the future (if we find a way to analyse this data)
var scheme = schema({
	type: String // Either linkedin/facebook/twitter
}, {
	strict: false
})

exports.SocialMetadata = mongoose.model("SocialMetadata", scheme)