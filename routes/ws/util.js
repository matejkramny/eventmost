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

exports.editURL = function (link){
	if(!link){
		return;
	}

	if (link.indexOf("http://") < 0 || link.indexOf("https://") < 0)
		return link;

	if(link.indexOf(config.host) < 0 && link.charAt(0) != "/")
		link = "/" + link;

	if(link.indexOf(config.host) < 0)
		link = config.host + link;

	if(link.indexOf("http://") < 0)
		link = "http://" + link;

	//console.log("returning " + link);
	return link;
}

