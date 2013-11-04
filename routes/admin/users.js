var models = require('../../models')

exports.show = function (req, res) {
	models.User.find({}, function(err, users) {
		if (err) throw err;
		res.locals.activePage = 2
		res.render('admin/users', { layout: 'admin/layout', users: users });
	})
}
