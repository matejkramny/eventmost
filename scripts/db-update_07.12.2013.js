require('../app');

var models = require('../models')

models.User.update({}, { $set: { disabled: false } }, { multi: true }, function(err, affected) {
	if (err) throw err;
	
	console.log("Executed, "+affected+" people affected");
	process.exit(0);
});