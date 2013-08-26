models = require('../../models')

exports.addEvent = function (req, res) {
	res.render('event/add', { title: "Add Event" })
}

exports.doAddEvent = function (req, res) {
	var newEvent = new models.Event({});
	
	newEvent.edit(req.body, req.user, req.files, function(err, ev) {
		if (err) {
			req.session.flash = err;
			res.redirect('/event/add');
			return;
		}
		
		res.redirect('/event/'+newEvent._id);
	});
}