var models = require('../../models')

exports.router = function (app) {
	app.get('/sendnewsletter', sendnewsletter)
}

function sendnewsletter (req, res) {
	console.log("hi newsletter");
	var email = "haseebkhilji@gmail.com";

	var options = {
			from: "EventMost <noreply@eventmost.com>",
			to: " <"+email+">",
			subject: "Feedback Newsletter ",
			html: "We've received a new Message"
		}


	config.transport.sendMail(options, function(err, response) {
			if (err) throw err;
			
			console.log("Email sent.."+response.message)
			res.format({
				json: function() {
					res.send({
						status: 200,
						message: "email sent"
					})
				}
			})
		})
	
}

