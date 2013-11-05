var models = require('../../models')

exports.show = function (req, res) {
	models.Event.find({}, function(err, events) {
		if (err) throw err;

			var eventsNow = 0
			var now = Date.now()
		for (var i = 0; i < events.length; i++) {
			var eventNow = events[i];
			var wstart = eventNow.start.getTime()
			var wend = eventNow.end.getTime()

			if (wstart < now < wend) {
				eventsNow++;
			}
		}

		res.locals.events = events;
		res.locals.activePage = 3
		res.render('admin/events', { layout: 'admin/layout', eventsNow: eventsNow });
	})
}
