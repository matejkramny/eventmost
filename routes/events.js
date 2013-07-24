exports.router = function (app) {
	app.get('/event/add', addEvent)
		.post('/event/add', doAddEvent)
		.get('/event/edit/:id', editEvent)
		.get('/event/remove/:id', removeEvent)
		.get('/events', listEvents)
}

exports.addEvent = addEvent = function (req, res) {
	res.render('event/add')
}

exports.doAddEvent = doAddEvent = function (req, res) {
	
}

exports.editEvent = editEvent = function (req, res) {
	
}

exports.removeEvent = removeEvent = function (req, res) {
	
}

exports.listEvents = listEvents = function (req, res) {
	
}