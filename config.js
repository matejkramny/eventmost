var mailer = require('nodemailer');
var fs = require('fs');
var colors = require('colors');
var stripe = require('stripe')

var credentials;
try {
	// Not on git, saves passwords from prying eyes of developers and unauthorised views..
	exports.credentials = credentials = require('./config-credentials.js')
} catch (e) {
	console.log("\n\n", "Required File Missing:".underline.red, "config-credentials.js".bold.green, "\n\n")
	process.exit(1);
}

exports.stripe = stripe(credentials.stripe.secret);

// Create SMTP transport method
exports.transport = mailer.createTransport("Mandrill", {
	auth: {
		user: credentials.smtp.user,
		pass: credentials.smtp.pass
	}
})

// In short, this will ensure a unique database for each environment
var mode = process.env.NODE_MODE;
if (!(mode == "test")) {
	mode = "";
}

exports.version = '0.2.5';
exports.host = credentials.host ? credentials.host : "eventmost.com";
exports.mode = mode;
exports.sessionKey = 'em_sess';
exports.sessionSecret = credentials.session_secret

exports.testroutes = credentials.testroutes;
exports.bugsnagKey = credentials.bugsnag_key;
exports.production = process.env.NODE_ENV == 'production' ? true : false;
exports.db = credentials.db;
if (mode == "test") {
	// Just for security, so it doesn't accidentally the whole DB
	exports.db += "_test";
}

exports.db_config = credentials.db_config;
exports.port = process.env.PORT || 3000;

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
