require('./prepare');

var app = require('../app');
var request = require('supertest').agent(app.app)

var should = require('should')
	, models = require('../models')

describe('Authentication', function() {
	var password = "password";
	
	var user = new models.User()
	user.name = "Name";
	user.surname = "Surname";
	user.email = "test@eventmost.com";
	
	// This user is never registered
	var user2 = new models.User()
	user2.name = "Name2";
	user2.surname = "Surname2";
	user2.email = "test2@eventmost.com"
	
	describe('Register', function() {
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
					should(err).be.equal(null);
				
					var body = req.res.body;
					body.status.should.be.equal(200);
				
					done()
				})
		})
		
		it('should require a name', function(done) {
			request
				.post('/auth/password')
				.send({
					login: user2.email,
					password: password,
					name: ''
				})
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);
				
					var body = req.res.body;
					body.status.should.not.be.equal(200);
				
					done()
				})
		})
		
		it('should not register', function(done) {
			request
				.post('/auth/password')
				.send({
					login: '',
					password: password,
					name: ''
				})
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);
				
					var body = req.res.body;
					body.status.should.not.be.equal(200);
				
					done()
				})
		})
	})
	
	describe('Login', function() {
		it('should log in', function(done) {
			request
				.post('/auth/password')
				.send({
					login: user.email,
					password: password
				})
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);
				
					var body = req.res.body;
					body.status.should.be.equal(200)
				
					done();
				})
		});
		it('should not login', function(done) {
			request
				.post('/auth/password')
				.send({
					login: user.email,
					password: password+'something'
				})
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);
				
					var body = req.res.body;
					body.status.should.not.be.equal(200)
				
					done()
				})
		})
	});
})