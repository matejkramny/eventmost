var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;
var Geolocation = require('./Geolocation').Geolocation;

var scheme = schema({
	deleted: { type: Boolean, default: false },
	name: { type: String, required: true },
	created: { type: Date, default: Date.now },
	start: { type: Date, required: true },
	end: { type: Date, required: true },
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
	avatar: { type: ObjectId, ref: 'Avatar' },
	address: String,
	allowAttendeesToCreateCategories: { type: Boolean, default: true },
	pricedTickets: { type: Boolean, default: false },
	categories: [],
	tickets: [{
		organiserPays: { type: Boolean, default: true, required: true },
		name: { type: String, required: true },
		price: { type: Number, required: true },
		number: { type: Number, required: true },
		summary: { type: String, required: true }
	}],
	accessRequirements: {
		private: { type: Boolean, default: true },
		password: { type: Boolean, default: false },
		passwordString: String,
		inRange: { type: Boolean, default: false }
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
			.populate('user attendees messages.user avatar')
			.exec(function(err, ev) {
				if (err) throw err;
				
				if (!ev) {
					cb(ev);
					return;
				}
				
				if (ev.avatar == null || ev.avatar.url == null || ev.avatar.url.length == 0) {
					var avatar = new models.Avatar({
						url: "/img/default-logo.svg"
					})
					avatar.save();
					ev.avatar = avatar._id;
					ev.save();
				}
				
				console.log(ev.avatar.url);
				
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
	this.user = user._id;
	
	if (body.name) {
		this.name = body.name
	}
	console.log("Avatar "+body.avatar);
	if (body.avatar) {
		try {
			console.log("Assigning avatar")
			this.avatar = mongoose.Types.ObjectId(body.avatar);
			console.log("ASsigned avatar")
		} catch (ex) {
			// objectid invalid
			if (process.env.NODE_ENV != 'production') {
				throw ex;
			}
		}
	}
	console.log(this.avatar);
	if (body.venue_name) {
		this.venue_name = body.venue_name
	}
	if (body.location) {
		this.address = body.location
	}
	if (body.description) {
		this.description = body.description
	}
	if (body.allowAttendeesToCreateCategories != null) {
		this.allowAttendeesToCreateCategories = body.allowAttendeesToCreateCategories
	}
	if (body.pricedTickets != null) {
		this.pricedTickets = body.pricedTickets
	}
	
	// restriction settings
	if (body.restriction != null) {
		var restriction = parseInt(body.restriction);
		if (!(isNaN(restriction) || restriction < 0 || restriction > 4)) {
			this.accessRequirements.private = false;
			this.accessRequirements.password = false;
			this.accessRequirements.inRange = false;
			
			if (restriction == 1) {
				this.accessRequirements.inRange = true;
			} else if (restriction == 2) {
				this.accessRequirements.password = true;
			} else if (restriction == 3) {
				this.accessRequirements.inRange = true;
				this.accessRequirements.password = true;
			} else if (restriction == 4) {
				this.accessRequirements.private = true;
			}
		}
	}
	
	if (body.password) {
		this.accessRequirements.passwordString = body.password;
	}
	
	// dates
	if (typeof body.start == "string") {
		this.start = parseInt(body.start);
		if (this.start == NaN) {
			this.start = null;
		}
	}
	if (typeof body.end == "string") {
		this.end = parseInt(body.end);
		if (this.end == NaN) {
			this.end = null;
		}
	}
	
	// categories - check typeof string
	if (body.categories != null) {
		this.categories = [];
		var categories = body.categories || [];
		for (var i = 0; i < categories.length; i++) {
			var cat = categories[i];
		
			if (typeof cat === "string") {
				this.categories.push(cat);
			}
		}
	}
	
	// do tickets - remove old tickets & create new objectids
	if (body.tickets != null) {
		this.tickets = [];
		var tickets = body.tickets || [];
		for (var i = 0; i < tickets.length; i++) {
			var ticket = tickets[i];
			var t = {};
		
			if (typeof ticket.organiserPays === "string" || typeof ticket.organiserPays === "boolean") {
				if (typeof ticket.organiserPays === "boolean") {
					t.organiserPays = ticket.organiserPays;
				} else {
					t.organiserPays = ticket.organiserPays == "false" ? false : true;
				}
			}
			if (typeof ticket.name === "string") {
				t.name = ticket.name;
			}
			if (typeof ticket.price === "string") {
				t.price = parseFloat(ticket.price);
			}
			if (typeof ticket.number === "string") {
				t.number = parseInt(ticket.number);
			}
			if (typeof ticket.summary === "string") {
				t.summary = parseFloat(ticket.summary);
			}
		
			this.tickets.push(t);
		}
	}
	
	if (body.lat != null && body.lng != null) {
		Geolocation.findOne({ event: this._id }, function(err, geo) {
			if (err) throw err;
		
			var lat = parseFloat(body.lat);
			var lng = parseFloat(body.lng);
		
			if (isNaN(lat) || isNaN(lng)) {
				// cannot save.
				return;
			}
		
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
	}
	
	// Validate the data
	var self = this;
	this.validate(function(errors) {
		if (errors && errors.length > 0) {
			// has errors
			cb(errors);
			return;
		}
		
		self.save(function(err) {
			if (err) throw err;
		});
		
		cb(null);
	});
}

scheme.methods.validate = function (cb) {
	var errs = [];
	if (!this.name || this.name.length == 0) {
		errs.push("Event Name must not be blank")
	}
	
	if (typeof this.start == "object" && this.start.getTime() == 0) {
		errs.push("Event Start Date must be valid")
	}
	if (typeof this.end == "object" && this.end.getTime() == 0) {
		errs.push("Event End Date must be valid")
	}
	if ((this.start && this.end) && this.end < this.start) {
		// event ends before it starts..
		errs.push("Event finishes before it begins. End date must be after the start date")
	}
	
	cb(errs);
}

scheme.methods.getGeo = function (cb) {
	Geolocation.find({ event: this._id }, function(err, geo) {
		if (err) throw err;
		
		this.geo = geo[0];
		
		cb();
	})
}

exports.Event = mongoose.model("Event", scheme);