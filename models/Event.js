var mongoose = require('mongoose');
var async = require('async');
var sanitizer = require('sanitizer');

var schema = mongoose.Schema
	, ObjectId = schema.ObjectId
	, Geolocation = require('./Geolocation').Geolocation
	, Avatar = require('./Avatar').Avatar
	, Attendee = require('./Attendee').Attendee
	, Ticket = require('./Ticket').Ticket
	, EventMessage = require('./EventMessage').EventMessage

var scheme = schema({
	deleted: { type: Boolean, default: false },
	name: { type: String, required: true },
	venue_name: { type: String, required: false },
	created: { type: Date, default: Date.now },
	start: { type: Date, required: true },
	end: { type: Date, required: true },
	attendees: [{
		type: ObjectId,
		ref: 'Attendee'
	}],
	geo: {}, // don't store anything here. - temporary placeholder when the event is loaded
	description: String,
	avatar: {
		type: ObjectId,
		ref: 'Avatar'
	},
	address: String,
	allowDropboxUpload: { type: Boolean, default: false },
	allowAttendeesToCreateCategories: { type: Boolean, default: false },
	allowAttendeesToComment: { type: Boolean, default: false },
	pricedTickets: { type: Boolean, default: false },
	categories: [],
	tickets: [{
		type: ObjectId,
		ref: 'Ticket'
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
		extension: String,
		file: String,
		size: String,
		name: String,
		permissions: {
			categories: [String],
			all: { type: Boolean, default: true }
		}
	}],
	messages: [{
		type: ObjectId,
		ref: 'EventMessage'
	}],
	//EventLayout
	sponsorLayout: {
		layout: { type: Number, default: 0 }, //Should we have a default with no logo/sponsor logo?
		sponsor1: {
			type: ObjectId,
			ref: 'Avatar'
		},
		sponsor2: {
			type: ObjectId,
			ref: 'Avatar'
		},
		sponsor3: {
			type: ObjectId,
			ref: 'Avatar'
		}
	},
})

scheme.statics.getEvent = function (id, cb) {
	try {
		exports.Event
			.findOne({ deleted: false, _id: mongoose.Types.ObjectId(id) })
			.populate('attendees.user files.user avatar attendees tickets messages')
			.exec(function(err, ev) {
				if (err) throw err;
				
				if (!ev) {
					cb(ev);
					return;
				}
				
				// a workaround for mongoose's bug of populating..
				async.parallel([
					//populate attendees
					function(callback) {
						async.each(ev.attendees, function(attendee, cb) {
							attendee.populate('user', function(err) {
								cb(null)
							})
						}, function(err) {
							callback(null)
						})
					},
					//avatar etc
					function(callback) {
						if (ev.avatar == null || ev.avatar.url == null || ev.avatar.url.length == 0) {
							var avatar = new Avatar({
								url: "/images/event-avatar-new.svg"
							})
							avatar.save();
							ev.avatar = avatar._id;
							ev.save();
						}
			
						ev.getGeo(function(geo) {
							callback(null)
						})
					},
					function (callback) {
						ev.populate('sponsorLayout.sponsor1 sponsorLayout.sponsor2 sponsorLayout.sponsor3', callback)
					}
				], function(err) {
					cb(ev)
				});
			}
		)
	} catch (ex) {
		cb();
	}
}

scheme.methods.getComments = function (cb) {
	var self = this;
	try {
		async.each(self.messages, function(message, cb) {
			message.populate('attendee likes comments', function(err) {
				async.parallel([
					function(cb) {
						message.attendee.populate('user', function() { cb(null) });
					},
					function(cb) {
						async.each(message.likes, function(like, cb) {
							like.populate('user', function() { cb(null) });
						}, function() {
							cb(null);
						})
					},
					function(cb) {
						async.each(message.comments, function(comment, cb) {
							comment.populate('attendee', function() {
								comment.attendee.populate('user', function() { cb(null) });
							});
						}, function() {
							cb(null);
						})
					}
				], function() {
					cb(null);
				})
			});
		}, function() {
			cb();
		})
	} catch (e) {
		cb()
	}
}

scheme.methods.edit = function (body, user, files, cb) {
	console.log(body);
	
	var self = this;
	
	if (this.attendees == null || this.attendees.length == 0) {
		this.attendees = [];
		var planner = new Attendee ({
			user: user._id,
			category: 'Planner',
			admin: true
		})
		this.attendees.push(planner._id)
		planner.save();
	}
	
	if (body.name) {
		this.name = body.name
	}
	
	// avatar, sponsor logos etc
	if (files) {
		if (files.avatar != null) {
			var av = this.avatar
			if (!av) {
				av = new Avatar({
					createdBy: user._id
				})
			}
			
			this.avatar = av._id;
			av.doUpload(files.avatar, function() {
				av.save()
			})
		}
		if (files.sponsor1 != null) {
			var av;
			if (this.sponsorLayout.sponsor1) {
				av = this.sponsorLayout.sponsor1;
			}
			
			if (!av) {
				av = new Avatar({
					createdBy: user._id
				})
			}
			
			this.sponsorLayout.sponsor1 = av._id;
			
			av.doUpload(files.sponsor1, function() {
				av.save()
			})
		}
		if (files.sponsor2 != null) {
			var av;
			if (this.sponsorLayout.sponsor2) {
				av = this.sponsorLayout.sponsor2;
			}
			
			if (!av) {
				av = new Avatar({
					createdBy: user._id
				})
			}
			
			this.sponsorLayout.sponsor2 = av._id;
			
			av.doUpload(files.sponsor2, function() {
				av.save()
			})
		}
		if (files.sponsor3 != null) {
			var av;
			if (this.sponsorLayout.sponsor3) {
				av = this.sponsorLayout.sponsor3;
			}
			
			if (!av) {
				av = new Avatar({
					createdBy: user._id
				})
			}
			
			this.sponsorLayout.sponsor3 = av._id;
			
			av.doUpload(files.sponsor3, function() {
				av.save()
			})
		}
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
		this.description = sanitizer.sanitize(body.description);
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
		var date = parseInt(body.start);
		if (date != NaN) {
			this.start = date;
		}
	}
	if (typeof body.end == "string") {
		var date = parseInt(body.end);
		if (date != NaN) {
			this.end = date;
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
			var t = new Ticket({
				whopays: 'me',
				type: 'standard',
				cutomType: '',
				quantity: 1,
				price: 0.0
			});
			
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
			
			t.save()
			
			this.tickets.push(t._id);
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
	
	if (body.layout) {
		var layout = parseInt(body.layout);
		if (layout >= 0 && layout <= 5) {
			this.sponsorLayout.layout = layout;
		}
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
	
	/* TODO later
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
	}*/
	
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