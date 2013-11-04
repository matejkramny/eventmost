var models = require('../../models')

exports.show = function (req, res) {
	models.EmailNotification.find({})
		.sort('-created')
		.exec(function(err, emailNotifications) {
			if (err) throw err;
		
			var now = Date.now();
			var last24hours = 0,
			last48hours = 0,
			lastWeek = 0,
			lastMonth = 0,
			lastYear = 0;
			
			for (var i = 0; i < emailNotifications.length; i++) {
				var email = emailNotifications[i];
				var created = email.created.getTime();
			
				if (now - 86400000 < created) {
					last24hours++;
				}
				if (now - 86400000*2 < created) {
					last48hours++;
				}
				if (now - 86400000*7 < created) {
					lastWeek++;
				}
				if (now - 86400000*7*4.3 < created) {
					lastMonth++;
				}
				if (now - 86400000*7*4.3*12 < created) {
					lastYear++;
				}
			}
		res.locals.activePage = 4
			res.render('admin/emails', {
				layout: 'admin/layout',
				emails: emailNotifications,
				last24hours: last24hours,
				last48hours: last48hours,
				lastWeek: lastWeek,
				lastMonth: lastMonth,
				lastYear: lastYear,
			})
	})
}