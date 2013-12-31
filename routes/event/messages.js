var models = require('../../models')
	, attending = require('./event').attending
	, socket = require('./socket')

exports.router = function (app) {
	app.get('/event/:id/messages', display)
		.get('/event/:id/comments', getComments)
		.post('/event/:id/comment', postComment)
		.post('/event/:id/like', likeComment)
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

function likeComment (req, res) {
	var cid = req.body.comment;
	
	try {
		models.EventMessage.findById(cid, function(err, comment) {
			if (err || !comment) {
				res.format({
					html: function() {
						res.redirect('/event/'+res.locals.ev._id);
					},
					json: function() {
						res.send(404, {})
					}
				})
				return;
			}
			
			var att = res.locals.attendee;
			var found = false;
			for (var i = 0; i < comment.likes.length; i++) {
				if (comment.likes[i].equals(att._id)) {
					found = true;
					break;
				}
			}
			
			if (found) {
				res.format({
					html: function() {
						res.redirect('/event/'+res.locals.ev._id);
					},
					json: function() {
						res.send({
							status: 400,
							message: "You like this already"
						})
					}
				})
			} else {
				comment.likes.push(att._id);
				comment.save();
				
				socket.notifyLike(res.locals.ev, comment, att)
				
				res.format({
					html: function() {
						res.redirect('/event/'+res.locals.ev._id);
					},
					json: function() {
						res.send({
							status: 200,
							message: "Liked"
						})
					}
				})
			}
		})
	} catch (e) {
		res.format({
			html: function() {
				res.redirect('/event/'+res.locals.ev._id);
			},
			json: function() {
				res.send(404, {})
			}
		})
	}
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
			
			socket.notifyComment(res.locals.ev, {
				_id: message._id,
				attendee: res.locals.attendee,
				message: message.message,
				inResponse: true,
				responseTo: msg._id,
				posted: new Date(),
				likes: [],
				comments: []
			}, msg)
			
			res.format({
				html: function() {
					res.redirect("/event/"+res.locals.ev._id)
				},
				json: function() {
					res.send({
						status: 200,
						message: "Comment Sent",
						cid: msg._id
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
		
		socket.notifyComment(res.locals.ev, {
			_id: msg._id,
			attendee: res.locals.attendee,
			message: message,
			posted: new Date(),
			likes: [],
			comments: []
		})
		
		res.format({
			html: function() {
				res.redirect("/event/"+res.locals.ev._id)
			},
			json: function() {
				res.send({
					status: 200,
					message: "Comment Sent",
					cid: msg._id
				})
			}
		})
	}
}