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
	, MongoStore = require('session-mongoose')(express)
	, authmethods = require('./routes/auth')
	, passport = require('passport')
	, config = require('./config')
	, socketPassport = require('passport.socketio')

if (config.mode != "test") {
	var bugsnag = require("bugsnag");
	bugsnag.register(config.bugsnagKey, {
		releaseStage: config.production ? "production" : "development",
		notifyReleaseStages: ['production'],
		appVersion: config.version
	})
}

var app = exports.app = express();

mongoose.connect(config.db, config.db_config);
var sessionStore = new MongoStore({
	connection: mongoose.connection,
	interval: 120000
});

config.configureConnection(mongoose.connection);

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
app.set('port', config.port); // Port
app.set('views', __dirname + '/views');
app.set('view engine', 'jade'); // Templating engine
app.set('view cache', true); // Cache views
app.set('app version', config.version); // App version
app.locals.pretty = !config.production // Pretty HTML outside production mode

//app.use(bugsnag.requestHandler);
if (config.mode != 'test') {
	app.use(express.logger('dev')); // Pretty log
}
app.use(express.limit('25mb')); // File upload limit
app.use(function(req, res, next) {
	var source = req.headers['user-agent'];
	if (!source || source.match(/webdav/i) == null) {
		next();
		return;
	}
	
	// Tell WebDAV to fuck off
	res.send(400, "");
})
// Health check..
app.use(function(req, res, next) {
	if (req.url.match(/^\/ping$/)) {
		if (mongoose.connection.readyState) {
			res.send(200, "pong");
		} else {
			res.send(500, "unhealthy");
		}
		
		return;
	}
	
	next()
})

app.use(express.bodyParser()); // Parse the request body
app.use(express.cookieParser()); // Parse cookies from header
app.use(express.methodOverride());
app.use(express.session({ // Session store
	key: config.sessionKey,
	secret: config.sessionSecret,
	store: sessionStore,
	cookie: {
		maxAge: 604800000 // 7 days in s * 10^3
	}
}));
if (config.mode != 'test') {
	app.use(express.csrf()); // csrf protection
}

app.use(passport.initialize());
app.use(passport.session());

// Custom middleware
app.use(function(req, res, next) {
	// request middleware
	if (config.mode != 'test') {
		res.locals.token = req.csrfToken();
	}
	
	res.header("X-Powered-By", "EventMost")
	
	res.locals.is_https = req.protocol == "https" ? true : false;
	
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
	
	res.locals.minified = "";//config.production ? ".min" : "";
	res.locals.bugsnag_key = config.bugsnagKey;
	
	// navigation bar
	next();
});

var server = http.createServer(app)
server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

exports.io = io = require('socket.io').listen(server)

io.set('authorization', socketPassport.authorize({
	cookieParser: express.cookieParser,
	key: config.sessionKey,
	secret: config.sessionSecret,
	store: sessionStore,
	fail: function(data, message, error, accept) {
		throw new Error(message)
	}
}))
io.set('log level', 1);

// HTTP routes
routes.router(app);

// WS routes
io.sockets.on('connection', function(socket) {
	routes.socket(socket)
});

app.use("/", express.static(path.join(__dirname, 'public'))); // serve static files

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

if (config.mode != "test") {
	app.use(bugsnag.errorHandler);
}
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
