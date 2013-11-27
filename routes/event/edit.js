var models = require('../../models'),
	attending = require('./event').attending

exports.router = function (app) {
	app.get('/event/:id/edit', editEvent)
		.post('/event/:id/edit', doEditEvent)
	//	.get('/event/:id/delete', deleteEvent)
	
}

function editEvent (req, res) {
	var ev = res.locals.ev;
	
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
	
	res.render('event/add', { ev: ev, title: "Edit event" });
}

function doEditEvent (req, res) {
	var errors = [];
	
	var ev = res.locals.ev;
	
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
				//req.session.flash = err || ["Event settings updated"];
				res.redirect('/event/'+ev._id)
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

function deleteEvent (req, res) {
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