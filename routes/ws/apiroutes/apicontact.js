var models = require('../../../models'),
	contact = models.Contact,
	transport
exports.router = function (app) {
	app.post('/api/contact', doContact)
}
function doContact (req, res) {
	var cont = new contact({
		subject: req.body.subject,
		message: req.body.message
	})
	console.log("email: " + req.body.email);
	if (cont.subject.length == 0 || cont.message.length == 0) {
		// Error
		res.format({
			json: function() {
				res.send({
					status: 403,
					message: "Subject and Message must contain information"
				})
			}
		})
		return;
	}
	
	cont.save(function(err) {
		var options = {
			from: "EventMost <noreply@eventmost.com>",
			to: " <"+req.body.email+">",
			subject: "Contact Message "+cont.subject,
			//html: "Contact form has been submitted on <strong>EventMost</strong>.<br /><strong>Subject:</strong> "+cont.subject+"<br/><strong>Message:</strong>"+cont.message+"<br/><br/>EventMost"
			html: "We've received a new Message: <br /><br />"+cont.message+"<br/><br/>EventMost"
		}
		
		/*if (!transport) {
			console.log("Getting transport")
			transport = require('../app').getTransport()
		}*/
		if (!config.transport_enabled) {
			console.log("Transport not enabled!")
			console.log(options);

			res.send({
				status: 406,
				err: ["Server is unable to send email."]
			});

			return;
		}
		/*if (!config.transport_enabled) {
			console.log("Transport not enabled!")
			console.log(options);
			return;
		}*/

		config.transport.sendMail(options, function(err, response) {
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
		
		/*res.format({
			html: function() {
				req.session.flash = ["Thank you. We will contact you shortly"]
				res.redirect('/contact');
			},
			json: function() {
				res.send({ sent: true });
			}
		})*/
		res.send({
			status: 200,
			message: ["Thank you. We will contact you shortly"]
		});
	});
}
