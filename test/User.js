var should = require('should')

var mongoose = require('mongoose')
	, models = require('../models')

require('./mongo')

describe('User', function() {
	var user = new models.User()
	user.name = "Name";
	user.surname = "Surname";
	
	describe('setName', function() {
		it('should correctly set "Name Surname"', function(done) {
			user.setName("Name Surname")
			
			user.name.should.equal("Name")
			user.surname.should.equal("Surname")
			
			done()
		})
		
		it('should assume no surname is given', function(done) {
			user.setName("Name ")
			
			user.name.should.equal("Name")
			user.surname.should.equal("")
			
			done()
		})
		
		it('should not fail if Name is blank', function(done) {
			user.setName("");
			
			user.name.should.equal("")
			user.surname.should.equal("")
			
			done()
		})
		
		it('should not fail if Name is null', function(done) {
			user.setName();
			
			user.name.should.equal("")
			user.surname.should.equal("")
			
			done()
		})
	})
	
	describe('getName', function() {
		it('should return a full name', function(done) {
			var name = "Matej Kramny"
			
			user.setName(name)
			user.getName().should.equal(name)
			
			done()
		})
		
		it('should return no surname when blank', function(done) {
			var name = "Matej"
			
			user.setName(name)
			user.getName().should.equal(name)
			
			done()
		})
		
		it('should return email when no name is set', function(done) {
			var email = "matej@matej.me"
			
			user.setName("")
			user.email = email
			
			user.getName().should.equal(email)
			
			done()
		})
		
		it('should return nothing when no name or email is set', function(done) {
			user.setName();
			user.email = null;
			
			user.getName().should.equal("");
			
			done()
		})
	})
	
	describe('setPassword', function() {
		it('should set a hash', function(done) {
			var password = "password"
			
			user.setPassword(password)
			user.password.should.equal(models.User.getHash(password))
			
			done()
		})
	})
})