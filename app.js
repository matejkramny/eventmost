// Newrelic, only runs on the server
if (process.env.NODE_ENV == "production") {
	require('newrelic');
}

var express = require('express')
	, routes = require('./routes')
	, http = require('http')
	, path = require('path')
	, mongoose = require('mongoose')
	, util = require('./util')
	, MongoStore = require('connect-mongo')(express)
	, authmethods = require('./routes/auth')
	, passport = require('passport')
	, config = require('./config')

var bugsnag = require("bugsnag");
bugsnag.register(config.bugsnagKey, {
	releaseStage: config.production ? "production" : "development",
	notifyReleaseStages: ['production'],
	appVersion: '0.2.0'
})

var app = exports.app = express();

var sessionStore; // session stored in database
if (config.production) {
	// production mode
	
	// In short, this will ensure a unique database for each environment
	var mode = process.env.NODE_MODE;
	if (mode == "dev" || mode == "staging") {
		mode = "-"+mode;
	} else {
		mode = "";
	}
	
	console.log("Production, mode "+mode);
	var db = config.db + mode;
	mongoose.connect(db, {
		auto_reconnect: true,
		native_parser: true
	});
	sessionStore = new MongoStore({
		url: db
	});
} else {
	// development mode
	console.log("Development");
	var db = "mongodb://127.0.0.1/eventmost";
	mongoose.connect(db, {
		auto_reconnect: true, native_parser: true
	});
	sessionStore = new MongoStore({
		url: db
	});
}

if (process.platform.match(/^win/) == null) {
	try {
		var spawn_process = require('child_process').spawn
		var readHash = spawn_process('git', ['rev-parse', '--short', 'HEAD']);
		readHash.stdout.on('data', function (data) {
			app.set('app version hash', data.toString().trim())
		})
	} catch (e) {
		console.log("\n~= Unable to obtain git commit hash =~\n")
	}
}

// all environments
app.enable('trust proxy');
app.set('port', process.env.PORT || 3000); // Port
app.set('views', __dirname + '/views');
app.set('view engine', 'jade'); // Templating engine
app.set('view cache', true); // Cache views
app.set('app version', '0.2.0'); // App version
app.locals.pretty = process.env.NODE_ENV != 'production' // Pretty HTML outside production mode

//app.use(bugsnag.requestHandler);
app.use(express.logger('dev')); // Pretty log
app.use(express.limit('25mb')); // File upload limit
//TODO SERVE STATIC SHIT ONLY FOR DEVELOPMENT.. PRODUCTION STUFF GETS SERVED BY NGINX. make a switch in process.env
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

app.use(passport.initialize());
app.use(passport.session());

// Custom middleware
app.use(function(req, res, next) {
	// request middleware
	res.locals.token = req.csrfToken();
	
	res.header("X-Powered-By", "EventMost")
	
	// flash
	if (req.session.flash) {
		res.locals.flash = req.session.flash;
	} else {
		req.session.flash = res.locals.flash = [];
	}
	
	res.locals.emptyFlash = function () {
		req.session.flash = []
	}
	
	res.locals.recentEvent = null;
	if (req.session.recentEvent) {
		res.locals.recentEvent = req.session.recentEvent;
		res.locals.recentEventName = req.session.recentEventName;
	}
	
	res.locals.user = req.user;
	res.locals.loggedIn = res.locals.user != null;
	
	res.locals.version = app.get('app version');
	res.locals.versionHash = app.get('app version hash');
	
	if (req.user) {
		req.user.lastAccess = Date.now()
		req.user.save()
	}
	
	res.locals.minified = config.production ? ".min" : "";
	
	// navigation bar
	next();
});

var server = http.createServer(app)
server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
//exports.io = require('socket.io').listen(server)

// routes
routes.router(app);
app.get('*', function(req, res, next) {
	if (!config.production) {
		next()
		return;
	}
	
	res.format({
		html: function() {
			res.redirect('/404')
		},
		json: function() {
			res.send(404, {
				message: "Not found"
			})
		}
	})
})

// development only
if (!config.production) {
	app.use(express.errorHandler()); // Let xpress handle errors
	app.set('view cache', false); // Tell Jade not to cache views
}

app.use(bugsnag.errorHandler);
app.use(function(err, req, res, next) {
	res.format({
		json: function() {
			res.send(500, {
				message: "Something went wrong."
			})
		},
		html: function() {
			res.redirect('/500');
		}
	})
})
