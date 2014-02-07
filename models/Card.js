var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;
var fs = require('fs')
	, exec = require('child_process').exec
	config = require('../config')

var scheme = schema({
	user: {
		type: ObjectId,
		ref: 'User'
	},
	location: String,
	created: { type: Date, default: Date.now() },
	primary: { type: Boolean, default: false }
});

scheme.methods.edit = function (html, cb) {
	var self = this;
	if (!html) {
		return cb("Invalid HTML!")
	}
	
	fs.readFile(html.path, function(err, htmlData) {
		if (err) throw err;
		
		htmlData = '<!DOCTYPE html><html><head>\
			<link rel="stylesheet" href="css/bootstrap.min.css">\
			<link href="css/cardcreator.css" rel="stylesheet">\
			<link href="css/cardcreator_generator.css" rel="stylesheet">\
		</head><body>'
		+ htmlData +
		'</body></html>';
		
		fs.writeFile(config.path+"/data/cardhtml/"+self._id+".html", htmlData, function(err) {
			if (err) throw err;
			
			var url = "file://"+config.path+"/data/cardhtml/"+self._id+".html"
			
			self.save(function(err) {
				if (err) throw err;
		
				console.log("Loading. "+url)
				
				try {
					var proc = exec('fab -f '+config.path+'/scripts/create_card.py -H eventmost@198.50.168.248 getCard:id="'+self._id+'"')
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
				} catch (e) {
					console.log("Is webkit2png installed? http://snippets.aktagon.com/snippets/504-how-to-generate-screenshots-on-debian-linux-with-python-webkit2png")
					cb("Internal Server Error");
				}
			})
		})
	})
}

exports.Card = mongoose.model("Card", scheme);