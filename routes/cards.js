exports.router = function (app) {
	app.get('/cards', showCards)
		.post('/card/new', saveCard)
}

function showCards (req, res) {
	res.render('cards')
}

function saveCard (req, res) {
	
}
