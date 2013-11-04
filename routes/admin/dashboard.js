exports.show = function(req, res) {
	models.User.find({}, function(err, users) {
		if (err) throw err;
	
		var twitterUsers = 0,
		fbUsers = 0,
		linkedInUsers = 0,
		last24hours = 0,
		last48hours = 0,
		lastWeek = 0,
		lastMonth = 0,
		lastYear = 0
	
		var now = Date.now()
		for (var i = 0; i < users.length; i++) {
			var user = users[i];
			var created = user.created.getTime()
		
			if (user.twitter.userid != null) twitterUsers++;
			if (user.facebook.userid != null) fbUsers++;
			if (user.linkedin.userid != null) linkedInUsers++;
		
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
		res.locals.activePage = 1
		res.render('admin/dashboard', {
			layout: 'admin/layout',
			users: users,
			twitterUsers: twitterUsers,
			facebookUsers: fbUsers,
			linkedinUsers: linkedInUsers,
			last24hours: last24hours,
			last48hours: last48hours,
			lastWeek: lastWeek,
			lastMonth: lastMonth,
			lastYear: lastYear
		})
	})
}