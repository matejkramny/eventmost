var config = require('../config');
var app = require('../app');
var request = require('supertest').agent(app.app)

var should = require('should'),
	models = require('../models')

should(config.mode).equal('test')

it('clean the database', function(done) {
	require('async').parallel([
		function(cb) {
			models.Card.remove(cb)
		},
		function(cb) {
			models.Event.remove(cb)
		},
		function(cb) {
			models.Favourite.remove(cb)
		},
		function(cb) {
			models.Message.remove(cb)
		},
		function(cb) {
			models.Note.remove(cb)
		},
		function(cb) {
			models.SharedCard.remove(cb)
		},
		function(cb) {
			models.Speaker.remove(cb)
		},
		function(cb) {
			models.Topic.remove(cb)
		},
		function(cb) {
			models.Upload.remove(cb)
		},
		function(cb) {
			models.User.remove(cb)
		},
		function(cb) {
			models.Message.remove(cb)
		},
		function(cb) {
			models.UserFile.remove(cb)
		},
		function(cb) {
			models.Geolocation.remove(cb)
		},
		function(cb) {
			models.EmailNotification.remove(cb)
		},
		function(cb) {
			models.SocialMetadata.remove(cb)
		},
		function(cb) {
			models.Avatar.remove(cb)
		},
		function(cb) {
			models.Attendee.remove(cb)
		},
		function(cb) {
			models.EventMessage.remove(cb)
		},
		function(cb) {
			models.Ticket.remove(cb)
		},
		function(cb) {
			models.EventStat.remove(cb)
		}
	], done)
})