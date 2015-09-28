var models = require('../../models')
	, attending = require('./event').attending
	, socket = require('./socket')
	, inbox = require('../inbox/index')
	, async = require('async')

exports.router = function (app) {
	app.get('/event/:id/comments', getComments)
		.post('/event/:id/comment', postComment)
		.delete('/event/:id/comment/:cid', deleteComment)
		.post('/event/:id/like', likeComment)
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
	console.log('getting like request');
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
				console.log("found already like");
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
				console.log("saving like to db");
				comment.likes.push(att._id);
				comment.save();
				
				//socket.notifyLike(res.locals.ev, comment, att)
				
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
				attendee: {
					user: {
						_id: res.locals.attendee.user._id,
						name: res.locals.attendee.user.name,
						surname: res.locals.attendee.user.surname
					}
				},
				message: message.message,
				inResponse: true,
				responseTo: msg._id,
				posted: new Date(),
				likes: [],
				comments: []
			}, function (sockets) {
				async.reject(res.locals.ev.attendees, function(attendee, cb) {
					async.detect(sockets, function(socket, cb) {
						cb(socket.handshake.user._id.equals(attendee.user._id));
					}, function(socket) {
						if (socket) {
							cb(true)
						} else {
							cb(false)
						}
					})
				}, function(attendees) {
					//People are posting comments for your event: ___.  To view conversation, click here.
					for (var i = 0; i < attendees.length; i++) {
						var u = attendees[i].user;
						if (attendees[i].hidden == true) continue;
						
						var split = message.message.split(" ");
						var messagePartial = message.message;
						if (split.length > 4) {
							split.splice(4);
							messagePartial = split.join(" ")+"...";
						}
						inbox.emailEventNotification(u, res.locals.ev, "event/"+res.locals.ev._id, messagePartial);
					}
				})
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
		})
	} else {
		var msg = new models.EventMessage({
			attendee: res.locals.attendee._id,
			message: message
		})
		msg.save()
		models.Event.findById(res.locals.ev._id, function(err, ev) {
			ev.messages.push(msg._id);
			ev.save()
		});
		
		socket.notifyComment(res.locals.ev, {
			_id: msg._id,
			attendee: {
				user: {
					_id: res.locals.attendee.user._id,
					name: res.locals.attendee.user.name,
					surname: res.locals.attendee.user.surname
				}
			},
			message: message,
			posted: new Date(),
			likes: [],
			comments: []
		}, function (sockets) {
			async.reject(res.locals.ev.attendees, function(attendee, cb) {
				async.detect(sockets, function(socket, cb) {
					cb(socket.handshake.user._id.equals(attendee.user._id));
				}, function(socket) {
					if (socket) {
						cb(true)
					} else {
						cb(false)
					}
				})
			}, function(attendees) {
				for (var i = 0; i < attendees.length; i++) {
					var u = attendees[i].user;
					if (attendees[i].hidden == true) continue;
					
					var split = message.split(" ");
					var messagePartial = message;
					if (split.length > 4) {
						split.splice(4);
						messagePartial = split.join(" ")+"...";
					}
					inbox.emailEventNotification(u, res.locals.ev, "event/"+res.locals.ev._id, messagePartial);
				}
			})
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

function deleteComment (req, res) {
	var cid;
	try {
		cid = req.params.cid;
	} catch (e) {
		res.format({
			html: function() {
				res.redirect('/event/'+res.locals.ev._id);
			},
			json: function() {
				res.send({
					status: 404
				})
			}
		})
		
		return;
	}
	
	models.EventMessage.findById(cid, function(err, msg) {
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
		
		if (res.locals.eventadmin || msg.attendee.equals(res.locals.attendee._id)) {
			// Can delete comment
			if (msg.isResponse) {
				// Delete from parent
				models.EventMessage.findOne({
					comments: {
						$in: [msg._id]
					}
				}, function(err, parent) {
					if (err) {
						throw err;
					}
					
					if (parent) {
						for (var i = 0; i < parent.comments.length; i++) {
							if (parent.comments[i].equals(msg._id)) {
								parent.comments.splice(i, 1);
								parent.save();
								break;
							}
						}
					} else {
						console.log("Message does not belong?");
					}
				})
			}
			
			for (var i = 0; i < msg.comments; i++) {
				// Delete sub-comments
				msg.comments[i].remove(function(err) {
					if (err) throw err;
				});
			}
			
			msg.remove(function(err) {
				if (err) throw err;
			});
			
			res.format({
				html: function() {
					res.redirect('/event/'+res.locals.ev._id);
				},
				json: function() {
					res.send({
						status: 200,
						message: "Comment Deleted"
					})
				}
			})
		} else {
			res.format({
				html: function() {
					res.redirect('/event/'+res.locals.ev._id);
				},
				json: function() {
					res.send({
						status: 404,
						message: "Not Owned by this user"
					})
				}
			})
			return;
		}
	})
}