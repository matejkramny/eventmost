var models = require('../../models')
	attending = require('./event').attending

exports.router = function (app) {
	app.get('/event/:id/messages', display)
		.post('/event/:id/messages', postMessage)
}

function display (req, res) {
	res.render('event/messages', { title: "Event Messages" })
}

function postMessage (req, res) {
	var message = req.body.message;
	
	if (!message) {
		res.redirect('/event/'+res.locals.ev._id);
		return;
	}
	
	var msg = new models.EventMessage({
		attendee: res.locals.attendee._id,
		message: message
	})
	msg.save()
	res.locals.ev.messages.push(msg._id);
	res.locals.ev.save()
	
	res.redirect("/event/"+res.locals.ev._id+"/messages")
}