exports.authorized = function (req, res, next) {
	if (req.user) {
		next()
	} else {
		res.format({
			html: function() {
				req.session.flash = ["You are not logged in"];
				res.redirect('/')
			},
			json: function() {
				res.send({
					status: 403,
					message: "Unauthorized"
				})
			}
		})
	}
}