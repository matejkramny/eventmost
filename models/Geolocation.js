var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	geo: {
		lat: { type: Number },
		lng: { type: Number }
	},
	event: {
		type: ObjectId,
		ref: 'Event'
	}
});

scheme.index({
	geo: '2d'
});

exports.Geolocation = mongoose.model("Geolocation", scheme);