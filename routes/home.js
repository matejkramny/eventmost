var models = require('../models');

exports.display = function (req, res) {
	var skip = req.query.skip || 0;
	
	var query = { 'attendees.user': req.user._id }
	models.Event.find(query)
		.sort('-start')
		.limit(5)
		.skip(skip)
		.populate('avatar')
		.exec(function(err, evs) {
		if (err) throw err;
		
		models.Event.find(query).count(function(err, total) {
			if (err) throw err;
			
			res.format({
				html: function() {
					res.render('home', {
						title: "Home",
						myevents: evs || [],
						myeventsTotal: total,
						myeventsSkip: skip
					});
				},
				json: function() {
					res.send({
						myeventsTotal: total,
						myevents: evs || [],
						title: "Home",
						myeventsSkip: skip
					})
				}
			});
		})
	});
}
