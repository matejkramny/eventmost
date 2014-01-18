require('./prepare');

var app = require('../app');
var request = require('supertest').agent(app.app).defaults({ jar: true });

var should = require('should')
	, models = require('../models')
	
describe('Administration', function() {
	var password, admin, user;
	
	before(function () {
		password = "password";
		
		admin = new models.User()
		admin.admin = true;
		admin.name = "EventMost";
		admin.surname = "Admin";
		admin.email = "admin@eventmost.com";
		admin.setPassword(password);
		admin.save();
		
		user = new models.User()
		user.name = "Name";
		user.surname = "Surname";
		user.email = "user@eventmost.com";
		user.setPassword(password);
		user.save();
	})
	
	describe('Peneterate into Admin', function() {
		describe('Admin User', function() {
			it('should log in', function(done) {
				request
					.post('/auth/password')
					.send({
						login: admin.email,
						password: password
					})
					.expect(200)
					.end(function(err, req) {
						should(err).be.equal(null);
						
						var body = req.res.body;
						body.status.should.be.equal(200);
						
						done()
					})
			})
			
			it('/admin', function(done) {
				request
					.get('/admin')
					.expect('Content-Type', /html/)
					.expect(200, done)
			})
			it('/admin/emails', function(done) {
				request
					.get('/admin/emails')
					.expect('Content-Type', /html/)
					.expect(200, done)
			})
		})
		
		describe('Normal User', function() {
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
						body.status.should.be.equal(200);
						
						done()
					})
			})
			
			it('redirect /admin', function(done) {
				request
					.get('/admin')
					.expect(302, done)
			})
			it('redirect /admin/emails', function(done) {
				request
					.get('/admin/emails')
					.expect(302, done)
			})
		})
	})
})