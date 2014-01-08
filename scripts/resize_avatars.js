require('../app');

var models = require('../models'),
	async = require('async');

models.User.find({ disabled: false }, function(err, users) {
	if (err) throw err;
	
	console.log("Converting... "+users.length+" people affected");
	
	async.each(users, function(user, cb) {
		user.createThumbnails(cb)
	}, function(err) {
		if (err) throw err;
		
		console.log("Finished")
		process.exit(0);
	});
});