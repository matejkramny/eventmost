var contact = require('../models/Contact').Contact,
	transport

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
	
	if (cont.subject.length == 0 || cont.message.length == 0) {
		// Error
		res.format({
			html: function() {
				req.session.flash.push("Subject and Message must contain information")
				res.redirect('/contact')
			},
			json: function() {
				res.send({
					status: 403,
					message: "Missing information"
				})
			}
		})
		return;
	}
	
	cont.save(function(err) {
		var options = {
			from: "EventMost <noreply@eventmost.com>",
			to: "matej+eventmost@matej.me",
			subject: "Contact form submitted "+cont.subject,
			html: "Contact form has been submitted on <strong>EventMost</strong>.<br /><strong>Subject:</strong> "+cont.subject+"<br/><strong>Message:</strong>"+cont.message+"<br/><br/>EventMost"
		}
		
		if (!transport) {
			console.log("Getting transport")
			transport = require('../app').getTransport()
		}
		transport.sendMail(options, function(err, response) {
			if (err) throw err;
			
			console.log("Email sent.."+response.message)
		})
		
		// Record that an email was sent
		var emailNotification = new models.EmailNotification({
			email: "staff",
			type: "contactForm"
		})
		emailNotification.save(function(err) {
			if (err) throw err;
		});
		
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
