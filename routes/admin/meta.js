var models = require('../../models')

exports.router = function (app) {
	app.get('/admin/meta', show)
	app.get('/admin/meta/:id', showMeta)
}

function show (req, res) {
	res.format({
		html: function() {
			res.locals.activePage = -1;
			res.render('admin/meta', { layout: 'admin/layout' });
		},
		json: function() {
			
			models.SocialMetadata.find({}, function(err, meta) {
				res.send({
					meta: meta
				})
			});
			
		}
	})
}
function showMeta (req, res) {
	models.SocialMetadata.findById(req.params.id, function(err, meta) {
		meta = JSON.parse(JSON.stringify(meta))
		res.render('admin/metaSingle', { layout: 'admin/layout', meta: meta });
	});
}