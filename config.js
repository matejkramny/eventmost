var mailer = require('nodemailer');
var fs = require('fs');
var colors = require('colors');
var stripe = require('stripe')

var credentials = exports.credentials = {
	replSet: process.env.DB_REPLSET || null,
	db: process.env.DB_AUTH || "mongodb://127.0.0.1/eventmost",
	host: process.env.HOST || "",
	bugsnag: process.env.BUGSNAG_KEY || "",
	smtp: {
		user: process.env.SMTP_USER || "",
		pass: process.env.SMTP_PASS || ""
	},
	newrelic: process.env.NEWRELIC || "",
	stripe: {
		secret: process.env.STRIPE_SECRET || "",
		pub: process.env.STRIPE_PUB || ""
	},
	social: {
		fb: {
			key: process.env.SOCIAL_FB_KEY || "fakekey",
			secret: process.env.SOCIAL_FB_SECRET || "fakesecret"
		},
		tw: {
			key: process.env.SOCIAL_TW_KEY || "fakekey",
			secret: process.env.SOCIAL_TW_SECRET || "fakesecret"
		},
		linkedin: {
			key: process.env.SOCIAL_LINKEDIN_KEY || "fakekey",
			secret: process.env.SOCIAL_LINKEDIN_SECRET || "fakesecret"
		}
	},
	session_secret: process.env.SESSION_SECRET || "KeyboardCat",
	testroutes: process.env.TESTROUTES || true
};

exports.db_config = {
	auto_reconnect: true,
	native_parser: true,
	server: {
		auto_reconnect: true
	}
};
if (credentials.replSet) {
	exports.db_config.replset = {
		rs_name: credentials.replSet
	};
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
