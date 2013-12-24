var models = require('../models')
	, mongoose = require('mongoose')
	, fs = require('fs')
	, event = require('./event/event')

exports.router = function (app) {
	event.router(app);
}

exports.socket = function (sock) {
	event.socket(sock)
}
