models = require('../../models')

exports.editEvent = function (req, res) {
	var id = req.params.id;
	
	models.Event
		.findOne(
			{
				deleted: false,
				_id: mongoose.Types.ObjectId(id)
			})
		.populate('user')
		.exec(function(err, ev) {
			if (err) throw err;
			
			if (ev) {
				if (!ev.user._id.equals(req.user._id)) {
					req.session.flash.push("Unauthorized")
					res.redirect('/');
					return;
				}
				
				models.Geolocation.findOne({ event: ev._id }, function(err, geo) {
					ev.geo = geo;
					res.render('event/edit', { event: ev });
				})
			} else {
				res.redirect('/')
			}
		})
}

exports.doEditEvent = function (req, res) {
	var errors = [];
	
	models.Event.findOne({
		_id: mongoose.Types.ObjectId(req.params.id),
		deleted: false
	}, function(err, ev) {
		if (err) throw err;
		
		if (!ev) {
			req.session.flash.push("Event not found!");
			res.redirect('/');
			return;
		}
		
		if (!ev.user.equals(req.user._id)) {
			req.session.flash.push("Unauthorized")
			res.redirect('/');
			return;
		}
		
		ev.edit(req.body, req.user, req.files, function(err) {
			if (err) {
				req.session.flash = err;
			} else {
				req.session.flash.push("Event settings updated");
			}
			
			res.redirect('/event/'+ev._id+"/edit");
		})
	})
}

exports.deleteEvent = function (req, res) {
	models.Event.findOne({ _id: mongoose.Types.ObjectId(req.params.id), deleted: false }, function(err, ev) {
		if (err) throw err;
		
		if (ev) {
			if (!ev.user.equals(req.user._id)) {
				req.session.flash.push("Unauthorized")
				res.redirect('/');
				return;
			}
			
			ev.deleted = true;
			ev.save(function(err) {
				if (err) throw err;
			});
			req.session.flash.push("Event deleted");
			res.redirect('/events/my')
		} else {
			res.redirect('/');
		}
	})
}