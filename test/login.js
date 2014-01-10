require('./prepare');

var app = require('../app');
var request = require('supertest').agent(app.app)

var should = require('should')
	, models = require('../models')

describe('Login', function() {
	var password = "password";
	
	var user = new models.User()
	user.name = "Name";
	user.surname = "Surname";
	user.email = "name@surname.com";
	
	it('should register', function(done) {
		request
			.post('/auth/password')
			.send({
				login: user.email,
				password: password,
				name: user.getName()
			})
			.expect(200)
			.end(function(err, req) {
				if (err) { done(err); return; }
				
				var body = req.res.body;
				if (body.status != 200) {
					done(new Error("Failed Registration"));
				} else {
					done()
				}
			})
	})
	it('should log in', function(done) {
		request
			.post('/auth/password')
			.send({
				login: user.email,
				password: password
			})
			.expect(200)
			.end(function(err, req) {
				if (err) { done(err); return; }
				
				var body = req.res.body;
				if (body.status != 200) {
					done(new Error("Failed Login"));
				} else {
					done()
				}
			})
	});
	it('should refuse login', function(done) {
		request
			.post('/auth/password')
			.send({
				login: user.email,
				password: password+'something'
			})
			.expect(200)
			.end(function(err, req) {
				if (err) { done(err); return; }
				
				var body = req.res.body;
				if (body.status == 200) {
					done(new Error("Logged In with Incorrect Credentials"));
				} else {
					done()
				}
			})
	})
})