exports.authorized = function (req, res, next) {
	if (req.loggedIn) {
		next()
	} else {
		res.format({
			html: function() {
				res.redirect('/')
			},
			json: function() {
				res.send({
					status: 403
				})
			}
		})
	}
}