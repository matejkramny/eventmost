var dropbox = require('./dropbox')
	, add = require('./add')
	, edit = require('./edit')
	, list = require('./list')
	, util = require('../../util')

exports.router = function (app) {
	app.get('/event/add', util.authorized, add.addEvent)
		.post('/event/add', util.authorized, add.doAddEvent)
		.get('/event/:id', util.authorized, exports.viewEvent)
		.get('/event/:id/edit', util.authorized, edit.editEvent)
		.post('/event/:id/edit', util.authorized, edit.doEditEvent)
		.get('/event/:id/delete', util.authorized, edit.deleteEvent)
		.post('/event/:id/join', util.authorized, exports.joinEvent)
		.get('/event/:id/attendees', util.authorized, list.listAttendees)
		.get('/event/:id/speakers', util.authorized, list.listSpeakers)
		.get('/event/:id/dropbox', util.authorized, dropbox.view)
		.post('/event/:id/dropbox/upload', util.authorized, dropbox.doUpload)
		.post('/event/:id/dropbox/remove', util.authorized, dropbox.doRemove)
		.get('/events', list.listEvents)
		.get('/events/my', util.authorized, list.listMyEvents)
		.get('/events/near', list.listNearEvents)
}

exports.viewEvent = function (req, res) {
	var id = req.params.id;
	if (!id) {
		res.redirect('/events');
	}
	
	var draw = function (ev, attending) {
		if (ev) {
			res.format({
				html: function() {
					res.render('event/view', { event: ev, attending: attending });
				},
				json: function() {
					res.send({
						event: ev,
						attending: attending
					});
				}
			});
		} else {
			res.format({
				html: function() {
					res.status(404)
					res.send("Not found")
				},
				json: function() {
					res.status(404);
					res.send({ error: "Not found" });
				}
			})
		}
	}
	
	models.Event.getEvent(id, function(ev) {
		if (!ev) {
			req.session.flash.push("Event not found");
			res.redirect('/');
			return;
		}
		console.log(ev);
		
		var attending = false;
		if (ev.user && ev.user._id.equals(req.user._id)) {
			// owns the event, no need to search if the user is attending
			attending = true;
		} else {
			for (var i = 0; i < ev.attendees.length; i++) {
				if (ev.attendees[i]._id.equals(req.user._id)) {
					attending = true;
					break;
				}
			}
		}
		
		draw(ev, attending);
	});
}

exports.joinEvent = function (req, res) {
	var id = req.params.id
		,password = req.body.password;
	
	var joinEvent = function (ev) {
		ev.attendees.push(req.user._id);
		ev.save();
	}
	
	models.Event.getEvent(id, function(ev) {
		if (ev) {
			if (ev.password.enabled) {
				if (ev.password.password == password) {
					// join event.
					joinEvent(ev);
				} else {
					// display flash stating they got the password wrong.
					req.session.flash.push("Event password incorrect.")
				}
			} else {
				// join event.
				joinEvent(ev);
			}
			
			res.redirect('/event/'+ev._id);
		} else {
			// TODO 404
		}
	})
}