var mongoose = require('mongoose');

var db;
if (process.env.NODE_ENV == 'production') {
	db = "mongodb://eventmost:OwaP0daelaek2aephi1phai9mopocah3Dakie9fi@127.0.0.1/eventmost-test";
} else {
	db = "mongodb://127.0.0.1/eventmost-test";
}

mongoose.connect(db, { auto_reconnect: true, native_parser: true });