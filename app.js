var express = require('express')
	, routes = require('./routes')
	, http = require('http')
	, path = require('path')
	, mongoose = require('mongoose')
	, util = require('./util')
	, MongoStore = require('connect-mongo')(express)
	, everyauth = require('everyauth')
	, authmethods = require('./routes/auth')
	, mailer = require('nodemailer')

var bugsnag = require("bugsnag");
bugsnag.register("6c73b59b8d37503c8e8a70d67613d067")

// Create SMTP transport method
var transport = mailer.createTransport("sendgrid", {
	auth: {
		user: "matej",
		pass: "Ye1aeph9eex2eghein3ve4foh6aih5"
	}
})
exports.getTransport = function() {
	return transport;
}

var app = exports.app = express();

var sessionStore; // session stored in database
if (process.env.NODE_ENV == 'production') {
	// production mode
	
	// In short, this will ensure a unique database for each environment
	var mode = process.env.NODE_MODE;
	if (mode == "dev" || mode == "staging") {
		mode = "-"+mode;
	} else {
		mode = "";
	}
	
	console.log("Production, mode "+mode);
	var db = "mongodb://eventmost:OwaP0daelaek2aephi1phai9mopocah3Dakie9fi@127.0.0.1/eventmost"+mode;
	mongoose.connect(db);
	sessionStore = new MongoStore({
		url: db
	});
} else {
	// development mode
	console.log("Development");
	var db = "mongodb://127.0.0.1/eventmost";
	mongoose.connect(db);
	sessionStore = new MongoStore({
		url: db
	});
	everyauth.debug = true;
}

// all environments
app.set('port', process.env.PORT || 3000); // Port
app.set('views', __dirname + '/views');
app.set('view engine', 'jade'); // Templating engine
app.set('view cache', true); // Cache views
app.set('app version', '0.0.2'); // App version
app.locals.pretty = process.env.NODE_ENV != 'production' // Pretty HTML outside production mode

app.use(bugsnag.requestHandler);
app.use(express.logger('dev')); // Pretty log
app.use(express.limit('25mb')); // File upload limit
app.use("/", express.static(path.join(__dirname, 'public'))); // serve static files
app.use(express.bodyParser()); // Parse the request body
app.use(express.cookieParser()); // Parse cookies from header
app.use(express.methodOverride());
app.use(express.session({ // Session store
	secret: "K3hsadkasdoijqwpoie",
	store: sessionStore,
	cookie: {
		maxAge: 604800000 // 7 days in s * 10^3
	}
}));
app.use(express.csrf()); // csrf protection

// Custom middleware
app.use(function(req, res, next) {
	// request middleware
	
	res.locals.token = req.session._csrf
	
	// flash
	if (req.session.flash) {
		res.locals.flash = req.session.flash;
	}
	req.session.flash = []
	
	// navigation bar
	next();
});

app.use(everyauth.middleware()); // Authentication middleware

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler()); // Let xpress handle errors
	app.set('view cache', false); // Tell Jade not to cache views
}

var server = http.createServer(app)
server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
//exports.io = require('socket.io').listen(server)

// routes
routes.router(app);

if (process.env.NODE_ENV == 'production') {
	console.log("Starting nodetime")
	
	// Make only one 'agent' running at the same time, free plan on nodetime only allows 1. :/
	// If EventMost expands the number of processes a larger plan will be required
	var ntime = require('nodetime')
	ntime.profile({
		accountKey: '5e94cba9ea3c85ec07684aa2ebca56885184bfb1', 
		appName: 'EventMost'
	});
	// Record errors with nodetime
	ntime.expressErrorHandler()
}
app.use(bugsnag.errorHandler);