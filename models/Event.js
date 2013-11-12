var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;
var Geolocation = require('./Geolocation').Geolocation;
var Avatar = require('./Avatar').Avatar

var scheme = schema({
	deleted: { type: Boolean, default: false },
	name: { type: String, required: true },
	venue_name: { type: String, required: false },
	created: { type: Date, default: Date.now },
	start: { type: Date, required: true },
	end: { type: Date, required: true },
	attendees: [{
		user: {
			type: ObjectId,
			ref: 'User'
		},
		category: String,
		admin: { type: Boolean, default: false },
		isAttending: { type: Boolean, default: true }, // gets set to false when the user exits the event..
		ticket: { type: ObjectId }
	}],
	geo: {}, // don't store anything here. - temporary placeholder when the event is loaded
	description: String,
	avatar: {
		type: ObjectId,
		ref: 'Avatar'
	},
	address: String,
	allowAttendeesToCreateCategories: { type: Boolean, default: false },
	allowAttendeesToComment: { type: Boolean, default: false },
	pricedTickets: { type: Boolean, default: false },
	categories: [],
	tickets: [{
		price: { type: Number, required: true },
		quantity: { type: Number, required: true },
		type: { type: String, required: true },
		customType: { type: String, required: false },
		whopays: { type: String, required: true }
	}],
	accessRequirements: {
		password: { type: Boolean, default: false },
		passwordString: String
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
		message: String
	}]
})

scheme.statics.getEvent = function (id, cb) {
	try {
		exports.Event
			.findOne({ deleted: false, _id: mongoose.Types.ObjectId(id) })
			.populate('attendees.user messages.user files.user avatar')
			.exec(function(err, ev) {
				if (err) throw err;
				
				if (!ev) {
					cb(ev);
					return;
				}
				
				if (ev.avatar == null || ev.avatar.url == null || ev.avatar.url.length == 0) {
					var avatar = new Avatar({
						url: "/images/event-avatar-new.svg"
					})
					avatar.save();
					ev.avatar = avatar._id;
					ev.save();
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
	console.log(body);
	
	var self = this;
	this.attendees = [{
		user: user._id,
		category: 'Planner',
		admin: true
	}];
	
	if (body.name) {
		this.name = body.name
	}
	
	if (body.avatar) {
		try {
			this.avatar = mongoose.Types.ObjectId(body.avatar);
		} catch (ex) {
			// objectid invalid
			if (process.env.NODE_ENV != 'production') {
				throw ex;
			}
		}
	}
	
	if (!this.avatar) {
		var avatar = new Avatar({
			url: "/images/event-avatar-new.svg"
		})
		avatar.save();
		this.avatar = avatar._id;
	}
	
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
	if (body.allowCommentsOnEvent != null) {
		this.allowCommentsOnEvent = body.allowCommentsOnEvent
	}
	if (body.pricedTickets != null) {
		this.pricedTickets = body.pricedTickets
	}
	
	// restriction settings
	if (body.passwordRequired != null) {
		this.accessRequirements.password = body.passwordRequired;
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
			var t = {
				whopays: 'me',
				type: 'standard',
				cutomType: '',
				quantity: 1,
				price: 0.0
			};
			
			if (typeof ticket.whopays === "string" && ticket.whopays == 'attendee') {
				t.whopays = 'attendee';
			}
			if (typeof ticket.type === 'string' && (ticket.type == 'premium' || ticket.type == 'custom')) {
				t.type = ticket.type;
			}
			if (typeof ticket.typeCustom === 'string' && ticket.type == 'custom') {
				t.customType = ticket.customType;
			}
			if (typeof ticket.price === "string") {
				t.price = parseFloat(ticket.price);
			}
			if (typeof ticket.quantity === "string") {
				t.quantity = parseInt(ticket.quantity);
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
				console.log("Cannot save lat&lng")
				return;
			}
		
			if (!geo) {
				geo = new Geolocation({});
			}
		
			if (!isNaN(lat) && !isNaN(lng)) {
				geo.geo.lat = lat;
				geo.geo.lng = lng;
				geo.event = self._id;
			
				geo.save();
			} else {
				geo.remove();
			}
		});
	}
	
	// Validate the data
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
	
	for (var i = 0; i < this.tickets.length; i++) {
		var t = this.tickets[i];
		
		if (typeof t.price !== 'number' || t.price < 0.0) {
			errs.push("Ticket "+t.type+"-"+t.customType+" has invalid price")
		}
		if (typeof t.quantity !== 'number' || t.quantity < 0) {
			errs.push("Ticket "+t.type+"-"+t.customType+" has invalid quantity")
		}
		if (typeof t.type !== 'string' || !(t.type == 'custom' || t.type == 'standard' || t.type == 'premium')) {
			errs.push("Ticket "+t.type+"-"+t.customType+" has invalid type")
		}
		if (typeof t.whopays !== 'string' || !(t.whopays == 'me' || t.whopays == 'attendee')) {
			errs.push("Ticket "+t.type+"-"+t.customType+" has invalid Who Pays attribute")
		}
	}
	
	cb(errs);
}

scheme.methods.getGeo = function (cb) {
	var self = this;
	Geolocation.find({ event: this._id }, function(err, geo) {
		if (err) throw err;
		
		self.geo = geo[0];
		
		cb();
	})
}

exports.Event = mongoose.model("Event", scheme);