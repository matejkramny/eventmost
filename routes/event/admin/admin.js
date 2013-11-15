var fs = require('fs'),
	models = require('../../models')
	, mongoose = require('mongoose')
	, util = require('../../util')
	, event = require('./event/event')

exports.router = function (app) {
	event.get('/admin', util.authorized, eventAdmin)
}