var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;
var Geolocation = require('./Geolocation').Geolocation;

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
	geo: {}, // don't store anything here. - temporary placeholder when the event is loaded
	description: String,
	avatar: { type: String, default: "/img/default_event.svg" },
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
	files: [{
		created: {
			type: Date,
			default: Date.now
		},
		user: {
			type: ObjectId,
			ref: 'User'
		},
		file: String,
		size: String,
		name: String
	}],
	messages: [{
		posted: { type: Date, default: Date.now },
		user: {
			type: ObjectId,
			ref: 'User'
		},
		spam: { type: Boolean, default: false },
		upVote: { type: Number, default: 0 },
		downVote: { type: Number, default: 0 },
		message: String
	}]
})

scheme.statics.getEvent = function (id, cb) {
	try {
		exports.Event
			.findOne({ deleted: false, _id: mongoose.Types.ObjectId(id) })
			.populate('user attendees messages.user')
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
	} catch (ex) {
		cb();
	}
}

scheme.methods.edit = function (body, user, files, cb) {
	if (body.name == null || body.name.length == 0) {
		cb([["Event name is missing"]])
		return;
	}
	
	var password_enabled = body.password_protected != null ? true : false;
	
	this.deleted = false;
	this.name = body.name;
	this.created = Date().now;
	this.start = Date.parse(body.date_start);
	this.end = Date.parse(body.date_end);
	this.user = user._id;
	this.description = body.desc;
	this.password = {
		enabled: password_enabled,
		password: password_enabled ? body.password : ""
	};
	this.address = body.address;
	
	this.settings.allowAttToGuest = body.allowAtt2Guest ? true : false;
	this.settings.allowAttToAtt = body.allowAtt2Att ? true : false;
	this.settings.upload = body.upload ? true : false;
	
	Geolocation.findOne({ event: this._id }, function(err, geo) {
		if (err) throw err;
		
		var lat = parseFloat(body.lat);
		var lng = parseFloat(body.lng);
		
		if (!geo) {
			geo = new Geolocation({});
		}
		
		if (!isNaN(lat) && !isNaN(lng)) {
			geo.geo.lat = lat;
			geo.geo.lng = lng;
			geo.event = this._id;
			
			geo.save();
		} else {
			geo.remove();
		}
	});
	
	if (files.avatar != null && files.avatar.name.length != 0) {
		var ext = files.avatar.type.split('/');
		var ext = ext[ext.length-1];
		
		this.avatar = "/avatars/"+this._id+"."+ext;
		
		fs.readFile(files.avatar.path, function(err, avatar) {
			fs.writeFile(__dirname + "/../public"+this.avatar, avatar, function(err) {
				if (err) throw err;
				
				this.save(function(err) {
					if (err) throw err;
					
					cb(null);
				})
			});
		});
		return;
	} else {
		this.save(function(err) {
			if (err) throw err;
			
			cb(null);
		})
	}
}

scheme.methods.getGeo = function (cb) {
	Geolocation.find({ event: this._id }, function(err, geo) {
		if (err) throw err;
		
		this.geo = geo[0];
		
		cb();
	})
}

