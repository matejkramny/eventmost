// Sample Credentials

exports.db_config = {
	auto_reconnect: true,
	native_parser: true,
	server: {
		auto_reconnect: true
	}
};

exports.db = "mongodb://127.0.0.1/localhost";

exports.host = ""; //e.g. 'eventmost.com' or 'dev.eventmost.com'

exports.bugsnag_key = "";

exports.smtp = {
	user: "",
	pass: ""
}

exports.newrelic = "";

exports.paypal = {
	host: "fakehost",
	id: "fakeid",
	secret: "fakesecret"
}
exports.stripe = {
	secret: "fakesecret",
	pub: "fakepub"
}

exports.social = {
	fb: {
		key: 'fakekey',
		secret: 'fakesecret'
	},
	tw: {
		key: 'fakekey',
		secret: 'fakesecret'
	},
	linkedin: {
		key: 'fakekey',
		secret: 'fakesecret'
	}
}

exports.session_secret = "KeyboardCat";