var api = require('./apiroutes')

// HTTP router
exports.router = function(app) {
	app.get('/api', function(req,res){res.send({token:"Test Token"})})
	
	// Used for JSON/XML auth responses
	api.router(app)
}
