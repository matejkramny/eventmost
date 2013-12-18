var models = require('../../models')
	attending = require('./event').attending

exports.router = function (app) {
	app.get('/event/:id/messages', display)
		.get('/event/:id/comments', getComments)
		.post('/event/:id/comment', postComment)
}

function display (req, res) {
	res.render('event/messages', { title: "Event Messages" })
}

function getComments (req, res) {
	res.locals.ev.getComments(function() {
		res.format({
			json: function() {
				res.send({
					status: 200,
					comments: res.locals.ev.messages
				})
			}
		})
	})
}

function postComment (req, res) {
	var message = req.body.message;
	var inResponse = req.body.inResponse || "";
	
	if (!message) {
		res.format({
			html: function() {
				res.redirect('/event/'+res.locals.ev._id);
			},
			json: function() {
				res.send({
					status: 404,
					message: "No Message Received"
				})
			}
		})
		return;
	}
	
	try {
		inResponse = mongoose.Types.ObjectId(inResponse);
	} catch (e) {
		inResponse = null;
	}
	
	if (inResponse != null) {
		console.log(req.body)
		models.EventMessage.findById(inResponse, function(err, msg) {
			if (err || !msg) {
				res.format({
					html: function() {
						res.redirect('/event/'+res.locals.ev._id);
					},
					json: function() {
						res.send({
							status: 404,
							message: "No Such Message"
						})
					}
				})
				return;
			}
			
			var message = new models.EventMessage({
				attendee: res.locals.attendee._id,
				message: req.body.message,
				inResponse: true
			})
			
			msg.comments.push(message._id);
			
			message.save();
			msg.save();
			
			res.format({
				html: function() {
					res.redirect("/event/"+res.locals.ev._id)
				},
				json: function() {
					res.send({
						status: 200,
						message: "Comment Sent"
					})
				}
			})
		})
	} else {
		var msg = new models.EventMessage({
			attendee: res.locals.attendee._id,
			message: message
		})
		msg.save()
		res.locals.ev.messages.push(msg._id);
		res.locals.ev.save()
		console.log("Yeah")
		res.format({
			html: function() {
				res.redirect("/event/"+res.locals.ev._id)
			},
			json: function() {
				res.send({
					status: 200,
					message: "Comment Sent"
				})
			}
		})
	}
}