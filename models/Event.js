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
	, config = require('../config')

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
	privateEvent: { type: Boolean, default: false }, // Makes event private.. No access without a link!
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
		fileThumb: String,
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
	source: {
		facebook: { type: Boolean, default: false },
		eventbrite: { type: Boolean, default: false },
		id: Number
	}
})

scheme.methods.arrangeFunctionAlphabetical = function (a, b) {
	var aName = a.user.getName().toLowerCase();
	var bName = b.user.getName().toLowerCase();
	if (aName > bName)
		return 1;
	if (aName < bName)
		return -1;
	
	return 0;
}

scheme.statics.getEvent = function (id, cb, simple) {
	if (typeof simple === 'undefined') {
		simple = false;
	}
	
	// Need to pull the model again due to a bug in mongoose https://github.com/LearnBoost/mongoose/issues/1912
	// a dismal solution, but works.. TODO replace when have time
	try {
		var q = exports.Event
			.findOne({ deleted: false, _id: id })
			.populate({
				path: 'attendees',
				match: { isAttending: true }
			})
		if (!simple) {
			q.populate('files.user avatar tickets messages')
		}
		
		q.exec(function(err, ev) {
			if (err) throw err;
			
			if (!ev) {
				cb(ev);
				return;
			}
			
			var stack = [
				//populate attendees
				function(callback) {
					async.each(ev.attendees, function(attendee, cb) {
						attendee.populate('user', function(err) {
							cb(null)
						})
					}, function(err) {
						callback(null)
					})
				}
			];
			
			if (!simple) {
				//avatar etc
				stack.push(function(callback) {
					if (ev.avatar == null || ev.avatar.url == null || ev.avatar.url.length == 0) {
						var avatar = new Avatar({
							url: "/images/event-avatar-new2.svg"
						})
						avatar.save();
						ev.avatar = avatar._id;
						ev.save();
					}
					
					ev.getGeo(function(geo) {
						callback(null)
					})
				});
				stack.push(function (callback) {
					ev.populate('sponsorLayout.sponsor1 sponsorLayout.sponsor2 sponsorLayout.sponsor3', callback)
				})
			}
			
			async.parallel(stack, function() {
				cb(ev)
			});
		})
	} catch (ex) {
		if (!config.production) {
			throw ex;
		}
		
		cb();
	}
}

scheme.methods.getComments = function (cb) {
	var self = this;
	// this is horrible.. not sure how we could go about fixing this..
	try {
		async.each(self.messages, function(message, cb) {
			message.populate('attendee likes comments', function(err) {
				async.parallel([
					function(cb) {
						message.attendee.populate('user', 'name surname _id avatar', function() { cb(null) });
					},
					function(cb) {
						async.each(message.likes, function(like, cb) {
							like.populate('user', 'name surname _id avatar', function() { cb(null) });
						}, function() {
							cb(null);
						})
					},
					function(cb) {
						async.each(message.comments, function(comment, cb) {
							comment.populate('likes attendee', function() {
								async.parallel([
									function(cb) {
										comment.attendee.populate('user', 'name surname _id avatar', function() { cb(null) });
									},
									function(cb) {
										async.each(comment.likes, function(like, cb) {
											like.populate('user', 'name surname _id avatar', function() { cb(null) });
										}, function() {
											cb(null);
										})
									}
								], function() {
									cb(null)
								})
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
	var self = this;
	
	if (this.attendees == null || this.attendees.length == 0) {
		this.attendees = [];
		var planner = new Attendee ({
			user: user._id,
			category: 'Planner',
			admin: true,
			isAttending: true
		})
		this.attendees.push(planner._id)
		planner.save();
	}
	
	if (body.name && body.name.length > 0) {
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
			url: "/images/event-avatar-new2.svg"
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
	if (body.privateEvent != null) {
		this.privateEvent = false;
		
		if (body.privateEvent == true) {
			this.privateEvent = true;
		}
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
		if (!isNaN(date)) {
			this.start = date;
		}
	}
	if (typeof body.end == "string") {
		var date = parseInt(body.end);
		if (!isNaN(date)) {
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
		var existing = [];
		var sentTickets = body.tickets;
		
		var tickets = this.tickets.slice();
		this.tickets = [];
		for (var t = 0; t < tickets.length; t++) {
			for (var x = 0; x < sentTickets.length; x++) {
				try {
					if (sentTickets[x]._id && mongoose.Types.ObjectId(sentTickets[x]._id).equals(tickets[t]._id)) {
						tickets[t].update(sentTickets[x]);
						tickets[t].save()
						this.tickets.push(tickets[t])
						
						sentTickets.splice(x, 1);
						break;
					}
				} catch (e) {}
			}
		}
		
		for (var x = 0; x < sentTickets.length; x++) {
			var t = new Ticket();
			t.update(sentTickets[x]);
			t.save(function (err) {
				if (err) throw err;
			});
			
			this.tickets.push(t);
		}
		
		this.markModified('tickets')
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