var models = require('../models');

exports.display = function (req, res) {
	models.Event.find({ 'attendees.user': { $in: [req.user._id] }, deleted: false })
		.sort('-start')
		.limit(5)
		.populate('avatar')
		.exec(function(err, evs) {
		if (err) throw err;
		
		res.render('home', { title: "Home", myevents: evs || [] });
	});
}
