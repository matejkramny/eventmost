var models = require('../../../../models')
	, attending = require('./apievent').attending
	, socket = require('./apisocket')
	, inbox = require('../apiinbox/index')
	, async = require('async')
	, mongoose = require('mongoose')

exports.router = function (app) {
	app.get('/api/event/:id/comments', getCommentsAPI)
		.post('/api/event/:id/comment', postCommentAPICustom)
		.post('/api/event/deletecomment', deleteCommentAPI)
		.post('/api/event/:id/like', likeCommentAPI)
		.post('/api/event/:id/unlike', unlikeCommentAPI)
}

function getCommentsAPI (req, res) {
	
	// Found the Event currently requested by user.
	models.Event.findOne({_id:req.params.id} , function(err, event) 
	{
		
		// Fetch Messages By One By One.
		var query = {'_id': {$in: event.messages}};
		console.log(req.body);
		models.EventMessage.find(query)
		.populate({path: 'attendee'})
		.select('attendee posted message spam isResponse likes')
		.sort('-created')
		.limit(25)
		.exec(function(err, messages) {
			var options = {
				path: 'attendee.user',
				model: 'User'
			};
			
			models.EventMessage.populate(messages , options , function(err , usermessages)
			{
				if(usermessages.length > 0){
					res.format({
						json: function() {
							res.send({
								status: 200,
								comments: usermessages
							})
						}
					});
				}else{
					res.format({
						json: function() {
							res.send({
								status: 404,
								message: "No Comment Found!"
							})
						}
					});
				}
			}
		);
	})
	});
}

function likeCommentAPI (req, res) {
	var cid = req.body.commentid;
	
	try {
		models.EventMessage.findById(cid, function(err, comment) {
			if(comment){
				var posted = comment.posted
				
				console.log(posted);
				if (err || !comment) {
					res.format({
						json: function() {
							res.send(404, {status: 404, error: err})
						}
					})
					return;
				}
					
				var att=req.body.attendeeid;
				
				var found = false;
			
				for (var i = 0; i < comment.likes.length; i++) {
					if (comment.likes[i].equals(att)) {
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
					// comment.likes.push(att);
					// comment.save();
					models.EventMessage.findByIdAndUpdate(cid, {$push: {likes: att}}, 
					        function(ex) {
					            if (ex)
					            {
					                console.log("Exception : " + ex);
					            }
					        }
						);
					
					//socket.notifyLike(res.locals.ev, comment, att)
					var totalLikes=comment.likes.length + 1;
				
					res.format({
						json: function() {
							res.send({
								status: 200,
								message: "Liked",
								posted:posted,
						        likes:totalLikes
							})
						}
					})
				}
			}else{
				res.format({
					json: function() {
						res.send({
							status: 404,
							message: "Comment Not Found!"
						})
					}
				})
			}
		})
	} catch (e) {
		res.format({
			json: function() {
				res.send({
					status: 404,
					message: "Not Found!",
					error: e
				})
			}
		})
	}
}

function unlikeCommentAPI (req, res) {
	var cid = req.body.commentid;
	
	try {
		models.EventMessage.findById(cid, function(err, comment) {
			if(comment){
				var posted = comment.posted
				
				console.log(posted);
				if (err || !comment) {
					res.format({
						json: function() {
							res.send(404, {})
						}
					})
					return;
				}
					
				var att=req.body.attendeeid;
				
				var found = false;
			
				for (var i = 0; i < comment.likes.length; i++) {
					if (comment.likes[i].equals(att)) {
						found = true;
						break;
					}
				}
				
				if (found) {
					models.EventMessage.findByIdAndUpdate(cid, {$pull: {likes: att}}, 
					        function(ex) {
					            if (ex)
					            {
					                console.log("Exception : " + ex);
					            }
					        }
						);
					
					//socket.notifyLike(res.locals.ev, comment, att)
					var totalLikes=comment.likes.length - 1;
				
					res.format({
						json: function() {
							res.send({
								status: 200,
								message: "Un-Liked",
								posted:posted,
						        likes:totalLikes
							})
						}
					})
				} else {
					// comment.likes.push(att);
					// comment.save();
					res.format({
						json: function() {
							res.send({
								status: 400,
								message: "no likes found"
							})
						}
					})
				}
			}else{
				res.format({
					json: function() {
						res.send({
							status: 404,
							message: "Not Found!"
						})
					}
				})
			}
		})
	} catch (e) {
		res.format({
			json: function() {
				res.send({
					status: 404,
					message: "Not Found!"
				})
			}
		})
	}
}

function postCommentAPICustom(req, res) {
	console.log("Post Comments ");
	var user_id = req.body._id;
	var inreplyto = req.body.inreplyto

	models.Event.findOne({_id: req.params.id})
		.populate(
		{
			path: 'attendees',
			match: {user: user_id}
		})
		.exec(function (err, event) {
			console.log("POSTCOMMENT: Event query executed.");
			if(err){
				console.log("POSTCOMMENT: ERR: " + err);
				
				res.send({
					status: 404,
					message: err
				})
				return;
			}
			
			console.log("POSTCOMMENT: No Error found");

			if(!event){
				console.log("POSTCOMMENT: Event DNE");
				res.send({
					status: 404,
					message: "Event not found"
				})
				return;
			}
			console.log("POSTCOMMENT: Event exists");
			// Found the Event. Now Found the Attendee Against the User ID.
			//console.log("Event ".red + event);
			
			if (event.banned && event.banned.length > 0) {
				console.log("POSTCOMMENT: Checking for banned IDS");
				for (var i = 0; i <= event.banned.length; i++) {
					if (event.banned[i] == user_id) {
						console.log("POSTCOMMENT: Banned user");
						res.send({
							status: 412,
							message: "UserID is banned from event"
						})
						return;
					}
				}
			}

			console.log("POSTCOMMENT: User not banned");
			
			if(inreplyto != undefined && inreplyto){
				console.log("POSTCOMMENT: inreplyto value exists");
				found = false;
				for(var mess = 0; mess < event.messages.length ; mess++){
					if(event.messages[mess] == inreplyto){
						found = true;
						break;
					}
				}
				if(!found){
					console.log("POSTCOMMENT: inreplyto message not found");
					res.send({
							status: 404,
							message: "in Reply to message not found"
						});
					return;
				}
				console.log("POSTCOMMENT: in reply to message found");
			}
			
			console.log("###################");
			// only attendee can comment
			console.log("POSTCOMMENT: attendees: " + event.attendees);
			if (event.attendees && event.attendees.length > 0) {
				var message = req.body.comment;
				var event_id = event._id;
				var attendee_id = event.attendees[0]._id;
				console.log("POSTCOMMENT: attendeeID: " + attendee_id);

				var msg = new models.EventMessage({
					attendee: attendee_id,
					message: message
				});

				msg.save();
				console.log("POSTCOMMENT: Message saved");				
				//console.log(msg)

				if(inreplyto){
					console.log("POSTCOMMENT: Updating in reply to");
					
					models.EventMessage.findByIdAndUpdate(inreplyto, {$set: { isResponse: true }}, function (err, message){
						console.log("In Response set")
						if(err)
							console.log(err);

						models.EventMessage.findById(inreplyto, function(err, evmsg){
							evmsg.comments.push(msg);
							evmsg.markModified('messages');
							evmsg.save();
							console.log("comments set")
							if(err)
								console.log(err)
						});
					});
					console.log("POSTCOMMENT: Updated in reply to");					
					res.format({
					json: function () {
							res.send({
								status: 200,
								comment: message
							})
						}
					})
					console.log("POSTCOMMENT: All done.");					
					return;
				}

				//console.log(msg);
				console.log("POSTCOMMENT: Event find by ID and update");

				//models.Event.findByIdAndUpdate(req.params.id, {$push: { messages: msg._id }}, function (err, message){
				//	if(err)
				//		console.log(err);
				//});
				
				models.Event.findById(req.params.id).populate("messages").exec(function (err, ev) {
				    ev.messages.push(msg);
					ev.markModified('messages');
			     	ev.save(function(err, updatedEvent){
						 console.info("Event Saved");
						 if(err)
						 	console.error(err);
					 });
					ev.markModified('messages');
				});

				console.log("POSTCOMMENT: All done");
				
				res.format({
					json: function () {
						res.send({
							status: 200,
							comment: message,
							id: msg._id
						})
					}
				})

				return;

			}
			else {
				console.log("POSTCOMMENT: Not an attendee ");
				
				res.format({
					json: function () {
						res.send({
							status: 401,
							message: "Not Authorized!"
						})
					}
				});
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
		cid = req.body.commentid;
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

	var attendeeid;
	attendeeid = req.body.attendeeid;
	
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
		
		if (msg.attendee.equals(attendeeid)) {
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
						status: 401,
						message: "Not Authorized!"
					})
				}
			})
			return;
		}
	})
}
