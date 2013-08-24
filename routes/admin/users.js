var models = require('../../models')

exports.show = function (req, res) {
	models.User.find({}, function(err, users) {
		if (err) throw err;
		
		res.render('admin/users', { layout: 'admin/layout', users: users });
	})
}
