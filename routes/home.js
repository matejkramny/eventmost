var models = require('../models');
var moment = require('moment')

exports.display = function (req, res) {
	var skip = req.query.skip || 0;
	
	models.Attendee.find({ 'user': req.user._id }, '_id', function(err, attendees) {
		
		var query = {
			'attendees': {
				$in: attendees
			}
		}
		models.Event.find(query)
			.sort('-created')
			.limit(5)
			.skip(skip)
			.populate('avatar')
			.select('name start end address venue_name avatar')
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
							myeventsSkip: skip,
							moment: moment
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
		
	})
}
