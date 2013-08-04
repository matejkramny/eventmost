var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;
var Geolocation = require('./Geolocation').Geolocation;
var Attendee = require('./Attendee').Attendee;

var scheme = schema({
	deleted: { type: Boolean, default: false },
	name: String,
	created: { type: Date, default: Date.now },
	start: Date,
	end: Date,
	user: {
		type: ObjectId,
		ref: 'User'
	},
	attendees: [{
		type: ObjectId,
		ref: 'User'
	}],
	geo: {}, // don't store anything here.
	description: String,
	avatar: String,
	address: String,
	geolocation: Boolean,
	password: {
		enabled: { type: Boolean, default: false },
		password: String
	},
	settings: {
		allowAttToGuest: { type: Boolean, default: true },
		allowAttToAtt: { type: Boolean, default: true },
		allowForumComments: { type: Boolean, default: true },
		moderateForumComments: { type: Boolean, default: false },
		upload: { type: Boolean, default: true }
	},
	defaultTweet: String
})

scheme.statics.getEvent = function (id, cb) {
	exports.Event
		.findOne({ deleted: false, _id: mongoose.Types.ObjectId(id) })
		.populate('user attendees')
		.exec(function(err, ev) {
			if (err) throw err;
			
			if (!ev) {
				cb(ev);
				return;
			}
			
			ev.getGeo(function(geo) {
				cb(ev);
			})
		}
	)
}

scheme.methods.getGeo = function (cb) {
	Geolocation.find({ event: this._id }, function(err, geo) {
		if (err) throw err;
		
		this.geo = geo[0];
		
		cb();
	})
}

exports.Event = mongoose.model("Event", scheme);