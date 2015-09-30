var models = require('../models');
var moment = require('moment')

exports.display = function (req, res) {
	var skip = req.query.skip || 0;
	var sort = req.query.sort || 'start';
	var firstDay = new Date();
	var nextWeek = new Date(firstDay.getTime() + 7 * 24 * 60 * 60 * 1000);

	var query = {
		
		deleted: false,
		start: {
			$gte: new Date()
		}
	};
	var newEvs = [];
	var sortby = '';
	if(sort == 'recent'){
		//sortby = {start: -1};
		sortby = {'start': -1};
	}else if(sort == 'name'){
		sortby = {'name':1};
	}else{
		sortby = {'start':1};
	}

	console.log(sortby);
	
	models.Event.find(query, null, {'sort': {'start':-1}}).limit(1).skip(skip).populate('avatar').exec(function(err, evs) {

		//Cleaning up the description...
		console.log(evs);
		evs.forEach(function(entry) {
			entry.name = entry.name.replace(/(<([^>]+)>)/ig,"");

			if((entry.source) && (entry.source.facebook == true || entry.source.meetup == true)){
				
			}else{
				if((entry.description) && entry.description != ''){
					entry.description = entry.description.replace(/(<([^>]+)>)/ig,"");
					entry.description = entry.description.trim();
					entry.description = entry.description.replace(/(\r\n|\n|\r)/gm,"");
					var totalLength = entry.description.length;
					entry.description = entry.description.substr(0, 350);
    				var newLength = entry.description.length;
    				if(totalLength > 350){
    					entry.description = entry.description+" . . .";
    				}
					
					newEvs.push(entry);
				}
			}

			
		});
		
		models.Event.find(query).count(function(err, total) {
			if (err) throw err;
		
			models.Card.findOne({ user: req.user._id, primary: true }, function(err, primaryCard) {
				if (err) throw err;
				
				res.locals.primaryCard = primaryCard;
				
				res.format({
					html: function() {
						res.render('home', {
							title: "EventMost",
							myevents: newEvs || [],
							myeventsTotal: total,
							myeventsSkip: skip,
							moment: moment,
							sort: req.query.sort
						});
					},
					json: function() {
						res.send({
							myeventsTotal: total,
							myevents: newEvs || [],
							title: "EventMost",
							myeventsSkip: skip,
							sort: req.query.sort
						})
					}
				});
			})
		})
	})
}
