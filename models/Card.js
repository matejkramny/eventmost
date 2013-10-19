var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;
var fs = require('fs')
	, phantom = require('phantom')

var scheme = schema({
	user: {
		type: ObjectId,
		ref: 'User'
	},
	html: String,
	location: String
});

scheme.methods.edit = function (html, cb) {
	var self = this;
	if (!html) {
		return cb("Invalid HTML!")
	}
	
	html = "<!DOCTYPE html><html><head></head><body>" 
	+ html + "</body></html>";
	
	console.log(html)
	self.html = html;
	
	self.save(function(err) {
		if (err) throw err;
		
		var page = phantom.create(function(ph) {
			ph.createPage(function(page) {
				page.open("http://127.0.0.1:3000/card/"+self._id, function(status) {
					console.log(status)
					
					if (status === 'success') {
						console.log("Finished!")
						page.render(__dirname+"/../public/businesscards/"+self._id+".png")
						cb(null);
					}
					
					ph.exit();
				})
			})
		})
	})
}

exports.Card = mongoose.model("Card", scheme);