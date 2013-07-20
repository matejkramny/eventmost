var express = require('express')
//	, routes = require('./routes')
	, http = require('http')
	, path = require('path')
	, mongoose = require('mongoose')
//	, util = require('./util')
//	, restricted = util.restricted
	, MongoStore = require('connect-mongo')(express);

var app = exports.app = express();

var sessionStore; // session stored in database
if (process.env.NODE_ENV == 'production') {
	// production mode
	
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
}

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view cache', true);
app.set('app version', '0.0.2');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.session({
	secret: "K3hsadkasdoijqwpoie",
	store: sessionStore
}));
app.use(express.bodyParser());
app.use(express.csrf()); // csrf protection
app.use(express.methodOverride());
app.use(function(req, res, next) {
	// request middleware
	
	// navigation bar
	next();
});

app.use(app.router);
app.use("/", express.static(path.join(__dirname, 'public'))); // serve static files

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
	app.set('view cache', false);
}

// routes
app.get('/',	function(req, res) {
	res.render('login');
})

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
