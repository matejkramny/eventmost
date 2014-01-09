require('../app');

var models = require('../models'),
	async = require('async');

models.User.find({}, function(err, users) {
	if (err) throw err;
	
	console.log("Converting... "+users.length+" people affected");
	
	async.each(users, function(user, cb) {
		user.createThumbnails(function() {
			user.save();
			cb();
		})
	}, function(err) {
		if (err) throw err;
		
		console.log("Finished")
		process.exit(0);
	});
});
