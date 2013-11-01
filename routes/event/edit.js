models = require('../../models')

exports.editEvent = function (req, res) {
	var ev = res.locals.event;
	
	var canEdit = false;
	for (var i = 0; i < ev.attendees.length; i++) {
		var at = ev.attendees[i];
		if (at.admin && at.user._id.equals(req.user._id)) {
			var canEdit = true;
			break;
		}
	}
	if (!canEdit) {
		req.session.flash.push("Unauthorized")
		res.redirect('/event/'+res.locals.event._id);
		return;
	}
	
	models.Geolocation.findOne({ event: ev._id }, function(err, geo) {
		ev.geo = geo;
		res.render('event/edit', { event: ev, title: "Edit event" });
	})
}

exports.doEditEvent = function (req, res) {
	var errors = [];
	
	var ev = res.locals.event;
	// Only planner can edit
	var canEdit = false;
	for (var i = 0; i < ev.attendees.length; i++) {
		var at = ev.attendees[i];
		if (at.admin && at.user._id.equals(req.user._id)) {
			var canEdit = true;
			break;
		}
	}
	if (!canEdit) {
		res.format({
			html: function() {
				req.session.flash.push("Unauthorized")
				res.redirect('/');
			},
			json: function() {
				res.send({
					status: 403,
					message: "Unauthorized"
				})
			}
		})
		
		return;
	}
	
	ev.edit(req.body, req.user, req.files, function(err) {
		res.format({
			html: function() {
				req.session.flash = err || ["Event settings updated"];
				res.redirect('/event/'+ev._id+"/edit")
			},
			json: function() {
				res.send({
					status: err ? 403 : 200,
					message: err || ["Event settings updated"]
				})
			}
		});
	})
}

exports.deleteEvent = function (req, res) {
	var ev = res.locals.event;
	
	// Only for event planners
	var isPlanner = false;
	for (var i = 0; i < ev.attendees.length; i++) {
		var at = ev.attendees[i];
		if (at.admin && at.user._id.equals(req.user._id)) {
			var isPlanner = true;
			break;
		}
	}
	if (!isPlanner) {
		res.format({
			html: function() {
				req.session.flash.push("Unauthorized")
				res.redirect('/');
			},
			json: function() {
				res.send({
					status: 403,
					message: "Unauthorized"
				})
			}
		})
		
		return;
	}
	
	// mark as deleted, don't *actually* delete
	ev.deleted = true;
	
	ev.save(function(err) {
		if (err) throw err;
		
		res.format({
			html: function() {
				req.session.flash.push("Event deleted");
				res.redirect('/events/my')
			},
			json: function() {
				res.send({
					status: 200,
					message: "Event deleted"
				})
			}
		})
	});
}