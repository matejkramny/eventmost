require('../app');

var models = require('../models'),
	async = require('async');

models.User.find({}, function(err, users) {
	if (err) throw err;
	
	console.log("Converting...", (" "+users.length+" ").inverse.bold, "people affected");
	
	async.eachSeries(users, function(user, cb) {
		user.createThumbnails(function() {
			user.save();
			
			cb();
		});
	}, function(err) {
		if (err) throw err;
		
		console.log("Finished".underline.green);
		process.exit(0);
	});
});
