var features = require('./features'),
	auth = require('./auth'),
	everyauth = require('everyauth')

exports.router = function(app) {
	app.get('/', features.displayFeatures)
		.get('/auth', auth.display)
		.get('/auth/finish', function(req, res) {
			console.log(everyauth.user)
			if (req.user.incomplete == true) {
				res.render('finishreg');
			} else {
				res.redirect('/')
			}
		})
}