var models = require('../../models')

exports.show = function (req, res) {
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
