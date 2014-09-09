var models = require('../../../../models')
	, attending = require('./apievent').attending
	, socket = require('./apisocket')
	, inbox = require('../apiinbox/index')
	, async = require('async')
	, mongoose = require('mongoose')

exports.router = function (app) {
	app.get('/api/event/:id/comments', getCommentsAPI)
		.post('/api/event/:id/comment', postCommentAPICustom)
		.delete('/api/event/:id/comment/:cid', deleteCommentAPI)
		.post('/api/event/:id/like', likeCommentAPI)
}

function getCommentsAPI (req, res) {
	console.log("Get Comments ".red);
	console.log(req.params.id);
	
	// Found the Event currently requested by user.
	models.Event.findOne({_id:req.params.id} , function(err, event) 
	{
		console.log("#######".red);
		console.log(event);
		console.log("#######".red);
		
		// Fetch Messages By One By One.
		var query = {'_id': {$in: event.messages}};
		
		models.EventMessage.find(query)
		.populate({path: 'attendee'})
		.select('attendee posted message spam isResponse likes')
		.sort('-created')
		.limit(10)
		.exec(function(err, messages) {
			
			
			var options = {
				path: 'attendee.user',
				model: 'User'
			};
			
			models.EventMessage.populate(messages , options , function(err , usermessages)
			{
				console.log("####################".red);
			console.log(usermessages);
			console.log("####################".red);
			
			res.format({
					json: function() {
						res.send({
							events: usermessages
						})
					}
				});
			}
		);
	})
	});
}

function likeCommentAPI (req, res) {
	var cid = req.body.comment;
	
	try {
		models.EventMessage.findById(cid, function(err, comment) {
			if (err || !comment) {
				res.format({
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
			json: function() {
				res.send(404, {})
			}
		})
	}
}

function postCommentAPICustom(req, res)
{
	console.log("Post Comments ".red);
	console.log(req.body);
	
	var user_id = req.body._id;
	console.log("User ID ".red + user_id);
	
	models.Event.findOne({_id : req.params.id})
	.populate(
		{
			path:'attendees',
			match: { user: user_id }
		}
	)
	.exec(function(err, event) 
	{	
		// Found the Event. Now Found the Attendee Against the User ID.
		console.log(event);
	// only attendee can comment
	if(event.attendees.length > 0)
	{
		var message = req.body.message;
		var event_id = event._id;
		var attendee_id =  event.attendees[0]._id;
		console.log(attendee_id);
		
		var msg = new models.EventMessage({
				attendee: attendee_id,
				message: message
		});
		
			msg.save();
			
			console.log(msg);
			
			models.Event.findById(req.params.id, function(err, ev) {
				ev.messages.push(msg._id);
				ev.save()
			});
			
			res.format({
				json: function() {
					res.send({
						status: 200
					})
				}
			})
			
			return;
		
	}
	else
	{
		console.log("Sending 404");
		res.status(404).send('Only Attendee Can Comment');
	}
	});
}

function postCommentAPI (req, res) {
	var message = req.body.message;
	var inResponse = req.body.inResponse || "";
	
	if (!message) {
		res.format({
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

function deleteCommentAPI (req, res) {
	var cid;
	try {
		cid = req.params.cid;
	} catch (e) {
		res.format({
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
				json: function() {
					res.send({
						status: 200,
						message: "Comment Deleted"
					})
				}
			})
		} else {
			res.format({
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
