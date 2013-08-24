var contact = require('../models/Contact').Contact

exports.about = function (req, res) {
	res.render('about')
}

exports.contactus = function (req, res) {
	res.render('contact')
}

exports.doContact = function (req, res) {
	var cont = new contact({
		subject: req.body.subject,
		message: req.body.message
	})
	cont.save(function(err) {
		// TODO Actually send the email
		
		res.format({
			html: function() {
				req.session.flash = ["Thank you. We will contact you shortly"]
				res.redirect('/contact');
			},
			json: function() {
				res.send({ sent: true });
			}
		})
	});
}
