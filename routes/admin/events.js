var models = require('../../models')

exports.show = function (req, res) {
	models.Event.find({}, function(err, events) {
		if (err) throw err;
		
		res.locals.events = events;
		res.render('admin/events', { layout: 'admin/layout' });
	})
}