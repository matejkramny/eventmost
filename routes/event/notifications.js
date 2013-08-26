var models = require('../../models')

exports.display = function (req, res) {
	res.render('event/notifications', { title: "Send push notifications" })
}