var mailer = require('nodemailer')

// Create SMTP transport method
exports.transport = mailer.createTransport("Mandrill", {
	auth: {
		user: "matej@matej.me",
		pass: "r8Zcz13BZIcJuiGXo2Kteg"
	}
})

// In short, this will ensure a unique database for each environment
var mode = process.env.NODE_MODE;
if (mode == "dev" || mode == "staging") {
	mode = "-"+mode;
} else {
	mode = "";
}

exports.sessionKey = 'em_sess';
exports.sessionSecret = 'K3hsadkasdoijqwpoie'

exports.bugsnagKey = "6c73b59b8d37503c8e8a70d67613d067";
exports.production = process.env.NODE_ENV == 'production' ? true : false;
exports.db = (exports.production ? "mongodb://eventmost:OwaP0daelaek2aephi1phai9mopocah3Dakie9fi@127.0.0.1/eventmost" : "mongodb://127.0.0.1/eventmost") + mode;
console.log(exports.db)
exports.path = __dirname;

exports.db_settings = {
	auto_reconnect: true,
	native_parser: true
}

if (exports.production) {
	// production mode
	console.log("Production");
} else {
	// development mode
	console.log("Development");
}

exports.configureConnection = function (db) {
	db.on('connected', function() {
		console.log("Connected to MongoDB")
	})
	db.on('disconnected', function() {
		console.log("Disconnected from MongoDB");
	})
	db.on('reconnected', function() {
		console.log("REConnected to MongoDB")
	})
}
