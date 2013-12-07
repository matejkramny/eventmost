var mailer = require('nodemailer')

// Create SMTP transport method
exports.transport = mailer.createTransport("Mandrill", {
	auth: {
		user: "matej@matej.me",
		pass: "r8Zcz13BZIcJuiGXo2Kteg"
	}
})

exports.bugsnagKey = "6c73b59b8d37503c8e8a70d67613d067";
exports.production = process.env.NODE_ENV == 'production' ? true : false;
exports.db = "mongodb://eventmost:OwaP0daelaek2aephi1phai9mopocah3Dakie9fi@127.0.0.1/eventmost"
exports.nodetimeKey = "5e94cba9ea3c85ec07684aa2ebca56885184bfb1";
exports.path = __dirname;