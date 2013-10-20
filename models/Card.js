var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;
var fs = require('fs')
	, exec = require('child_process').exec

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
	
	html = '<!DOCTYPE html><html><head>\
		<link rel="stylesheet" href="/v2/css/bootstrap.min.css">\
		<link rel="stylesheet" href="/v2/css/bootstrap-eventmost.css">\
		<link href="/css/cardcreator.css" rel="stylesheet">\
		<link href="/css/cardcreator_generator.css" rel="stylesheet">\
	</head><body>'
	+ html +
	'</body></html>';
	
	console.log(html)
	self.html = html;
	
	var url = "http://127.0.0.1:"+(process.env.PORT || 3000)+"/card/"+self._id
	console.log(url)
	
	self.save(function(err) {
		if (err) throw err;
		
		console.log("Loading.")
		
		process.env.PHANTOM_WEBPAGE = url;
		process.env.PHANTOM_CARD_ID = self._id;
		
		var proc = exec('cd '+__dirname+'/../scripts/; ../node_modules/phantomjs/bin/phantomjs createBusinessCard.js')
		proc.stdout.on('data', function(chunk) {
			console.log(chunk)
		})
		proc.stderr.on('data', function(chunk) {
			console.log(chunk)
		})
		proc.on('close', function(code) {
			console.log("Done, code "+code);
			
			cb(null)
		})
	})
}

exports.Card = mongoose.model("Card", scheme);