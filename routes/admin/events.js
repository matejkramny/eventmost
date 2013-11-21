var models = require('../../models')

exports.router = function (app) {
	app.get('/admin/events', show)
		
		.get('/admin/events/:id/delete', removeEvent)
		.get('/admin/events/:id/remove', removeEventCompletely)
		.get('/admin/events/:id/revive', reviveEvent)
}

function show (req, res) {
	models.Event.find({}, function(err, events) {
		if (err) throw err;

			var eventsNow = 0
		for (var i = 0; i < events.length; i++) {
			var eventss = events[i];
			var cDate = Date.now();
			var fDate = eventss.start.getTime();
			var lDate = eventss.end.getTime();

			if ((cDate <= lDate && cDate >= fDate)) {
				eventsNow++;
			};
		}

		res.locals.events = events;
		res.locals.activePage = 3
		res.render('admin/events', { layout: 'admin/layout', eventsNow: eventsNow, cDate: cDate, lDate: lDate, fDate: fDate });
	})
}

function removeEventCompletely (req, res, next) {
	models.Event.remove({ _id: req.params.id }, function(err) {
		if (!err) {
			res.redirect('/admin/events');
		}
		else {
			throw err;
		}
	});
}

function reviveEvent (req, res, next) {
	models.Event.findById(req.params.id, function (err, event) {
		if (err) return handleError(err);
		
		event.deleted = false;
		event.save(function (err) {
			if (err) return handleError(err);
			res.send(event);
		});
	});
	
	res.redirect('/admin/events')
}

function removeEvent (req, res, next) {
	models.Event.findById(req.params.id, function (err, event) {
		if (err) return handleError(err);
		
		event.deleted = true;
		event.save(function (err) {
			if (err) return handleError(err);
			res.send(event);
		});
	});
	
	res.redirect('/admin/events')
}