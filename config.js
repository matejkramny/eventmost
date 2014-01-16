var mailer = require('nodemailer');
var fs = require('fs');
var colors = require('colors');
var paypal_sdk = require('paypal-rest-sdk');

var credentials;
try {
	// Not on git, saves passwords from prying eyes of developers and unauthorised views..
	exports.credentials = credentials = require('./config-credentials.js')
} catch (e) {
	console.log("\n\n", "Required File Missing:".underline.red, "config-credentials.js".bold.green, "\n\n")
	process.exit(1);
}

paypal_sdk.configure({
	host: "api.sandbox.paypal.com",
	port: '',
	client_id: credentials.paypal.id,
	client_secret: credentials.paypal.secret
});

// Create SMTP transport method
exports.transport = mailer.createTransport("Mandrill", {
	auth: {
		user: credentials.smtp.user,
		pass: credentials.smtp.pass
	}
})

// In short, this will ensure a unique database for each environment
var mode = process.env.NODE_MODE;
if (!(mode == "dev" || mode == "staging" || mode == "test")) {
	mode = "";
}

exports.mode = mode;
exports.sessionKey = 'em_sess';
exports.sessionSecret = credentials.session_secret

exports.bugsnagKey = credentials.bugsnag_key;
exports.production = process.env.NODE_ENV == 'production' ? true : false;
exports.db = (exports.production ? "mongodb://"+credentials.db.production+"@127.0.0.1/eventmost" : "mongodb://127.0.0.1/eventmost") + (mode.length > 0 ? "-" + mode : "");
exports.port = process.env.PORT || 3000;

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
		console.log("Reconnected to MongoDB")
	})
}
