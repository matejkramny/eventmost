exports.authorized = function (req, res, next) {
	if (req.body._csrf) {
		next()
	}
	 else {
		res.format({
			html: function() {
				req.session.flash = ["You are not logged in"];
				req.session.redirectAfterLogin = req.url;
				res.redirect('/?fail-reason=Please Log In. You will be transferred where you were after that..#login-failed')
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

