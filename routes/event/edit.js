var models = require('../../models'),
	config = require('../../config'),
	fs = require('fs'),
	attending = require('./event').attending

exports.router = function (app) {
	app.get('/event/:id/edit', editEvent)
		.post('/event/:id/edit', doEditEvent)
		.post('/event/:id/editevpart', doEditEventPart)		
	//	.get('/event/:id/delete', deleteEvent)
		.post('/event/:id/delete/sponsor', doEditEventSponsor)
	
}

function editEvent (req, res) {
	var ev = res.locals.ev;
	
	var canEdit = false;
	for (var i = 0; i < ev.attendees.length; i++) {
		var at = ev.attendees[i];
		if (at.admin && at.user._id.equals(req.user._id)) {
			var canEdit = true;
			break;
		}
	}
	
	if (!canEdit) {
		res.format({
			html: function() {
				req.session.flash.push("Unauthorized")
				res.redirect('/');
			},
			json: function() {
				res.send({
					status: 403,
					message: "Unauthorized"
				})
			}
		})
		
		return;
	}
	
	res.render('event/add', { ev: ev, title: "Edit event" });
}

function doEditEventPart (req, res) {
	var ev = res.locals.ev;
	var canEdit = false;
	for (var i = 0; i < ev.attendees.length; i++) {
		var at = ev.attendees[i];
		//console.log(at);
		if (at.admin && at.user._id.equals(req.user._id)) {
			var canEdit = true;
			break;
		}
	}
	
	if (!canEdit) {
		res.format({
			html: function() {
				req.session.flash.push("Unauthorized")
				res.redirect('/');
			},
			json: function() {
				res.send({
					status: 403,
					message: "Unauthorized"
				})
			}
		})
		
		return;
	}
	
	models.Event.findOne({ deleted: false, _id: ev._id }, function(err, event) {
		if (err) throw err;
		
		var evPartData;
		switch(req.body.what)
		{
			case 'when':
				evPartData = { start: req.body.val1, end: req.body.val2 };
				break;
			case 'where':
				evPartData = { venue_name: req.body.val1, address: req.body.val2 };
				break;
			case 'desc':
				evPartData = { description: req.body.val1 };
				break;
		}

		console.log(evPartData);
		console.log("=================================================");
		if (event) {
			//models.Event.update({ _id: ev._id  }, { $set: { venue_name: req.body.val1, address: req.body.val2 }}, { multi: false }, function(err) {
			models.Event.update({ _id: ev._id  }, { $set: evPartData}, { multi: false }, function(err) {
				if (err) throw err;

				if(req.body.what=='where')
					updateGeo(event, req.body.val3, req.body.val4);
	
				res.format({
					html: function() {
						res.redirect('/event/'+ev._id+'/registrationpage/e')
					},
					json: function() {
						res.send({
							status: err ? 403 : 200,
							message: err || ["Event settings updated"]
						})
					}
				});


				return;
			});
		} else {
			res.redirect('back');
			return;
		}
	})

	return;
}

function updateGeo(ev, lat, lng){

	ev.setGeo(lat, lng, function() {
		//callback(null)
		return;
	})
}

function doEditEvent (req, res) {

	//console.log('doEditEvent');
	var errors = [];
	
	var ev = res.locals.ev;
	
	var canEdit = false;
	for (var i = 0; i < ev.attendees.length; i++) {
		var at = ev.attendees[i];
		if (at.admin && at.user._id.equals(req.user._id)) {
			var canEdit = true;
			break;
		}
	}
	
	if (!canEdit) {
		res.format({
			html: function() {
				req.session.flash.push("Unauthorized")
				res.redirect('/');
			},
			json: function() {
				res.send({
					status: 403,
					message: "Unauthorized"
				})
			}
		})
		
		return;
	}
	
	models.Event.findOne({ deleted: false, _id: ev._id }).populate('files.user avatar attendees tickets messages').exec(function(err, ev) {
		ev.edit(req.body, req.user, req.files, function(err) {
			res.format({
				html: function() {
					//req.session.flash = err || ["Event settings updated"];
					res.redirect('/event/'+ev._id)
				},
				json: function() {
					res.send({
						status: err ? 403 : 200,
						message: err || ["Event settings updated"]
					})
				}
			});
		})
	})
}

function doEditEventSponsor(req, res) {
	var errors = [];
	var ev = res.locals.ev;
	
	var canEditSponsor = false;
	for (var i = 0; i < ev.attendees.length; i++) {
		var at = ev.attendees[i];
		if (at.admin && at.user._id.equals(req.user._id)) {
			var canEditSponsor = true;
			break;
		}
	}
	
	if (!canEditSponsor) {
		res.format({
			html: function() {
				req.session.flash.push("Unauthorized")
				res.redirect('/');
			},
			json: function() {
				res.send({
					status: 403,
					message: "Unauthorized"
				})
			}
		})
		
		return;
	}

	
	
   //console.log(config)
	var name = req.body.name;
	var sponsor1 = ev.sponsorLayout.sponsor1;
	var sponsor2 = ev.sponsorLayout.sponsor2;
	var sponsor3 = ev.sponsorLayout.sponsor3;
	
	if(sponsor1){
		models.Event.findOne({_id: ev._id }, function(err, ev) {
			if(sponsor1  && name == 1){
				//console.log(sponsor1._id+'sponsor1')				
				//console.log(sponsor1.url+" url")
				if (fs) {
					fs.unlink(config.path + "/public" + sponsor1.url, function (err) {
						if (err) throw err;					  	
					  	console.log('successfully deleted '+config.path + "/public" + sponsor1.url);
					});
					models.Avatar.remove({_id: sponsor1._id}, true);
					ev.sponsorLayout.sponsor1 = undefined;
				}
			}
			else if (sponsor2  && name == 2){
				if (fs) {
					/*
					config.knox.deleteFile(config.path + "public" + sponsor2.url, function(err, res){
	  					if (err) throw err;
					});
					*/
					fs.unlink(config.path + "/public" + sponsor2.url, function (err) {
					  	if (err) throw err;					  	
					  	//console.log('successfully deleted '+config.path + "/public" + sponsor2.url);
					});
					models.Avatar.remove({_id: sponsor2._id}, true);
					ev.sponsorLayout.layout = 0;
					ev.sponsorLayout.sponsor2 = undefined;
					
				}
			}
			else if (sponsor3  && name == 3){
				//console.log(sponsor3._id+'sponsor3')
				
				//console.log(sponsor3.url+" url")
				if (fs) {
					fs.unlink(config.path + "/public" + sponsor3.url, function (err) {
					  	if (err) throw err;
					  	
						//console.log('successfully deleted '+config.path + "/public" + sponsor3.url);
					});
					models.Avatar.remove({_id: sponsor3._id}, true);
					ev.sponsorLayout.layout = 1;
					ev.sponsorLayout.sponsor3 = undefined;
				}
				
			}
			ev.save();
			res.locals.ev = ev;
			//console.log(ev._id)			
		});
	}
	return 'remove';
}

function deleteEvent (req, res) {
	var ev = res.locals.event;
	
	// Only for event planners
	var isPlanner = false;
	for (var i = 0; i < ev.attendees.length; i++) {
		var at = ev.attendees[i];
		if (at.admin && at.user._id.equals(req.user._id)) {
			var isPlanner = true;
			break;
		}
	}
	if (!isPlanner) {
		res.format({
			html: function() {
				req.session.flash.push("Unauthorized")
				res.redirect('/');
			},
			json: function() {
				res.send({
					status: 403,
					message: "Unauthorized"
				})
			}
		})
		
		return;
	}
	
	models.Event.findById(ev._id, function(err, ev) {
		// mark as deleted, don't *actually* delete
		ev.deleted = true;
	
		ev.save(function(err) {
			if (err) throw err;
		
			res.format({
				html: function() {
					req.session.flash.push("Event deleted");
					res.redirect('/events/my')
				},
				json: function() {
					res.send({
						status: 200,
						message: "Event deleted"
					})
				}
			})
		});
	});
}