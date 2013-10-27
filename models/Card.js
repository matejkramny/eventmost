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
	location: String,
	created: { type: Date, default: Date.now() }
});

scheme.methods.edit = function (html, cb) {
	var self = this;
	if (!html) {
		return cb("Invalid HTML!")
	}
	
	fs.readFile(html.path, function(err, htmlData) {
		if (err) throw err;
		
		htmlData = '<!DOCTYPE html><html><head>\
			<link rel="stylesheet" href="../../public/v2/css/bootstrap.min.css">\
			<link href="../../public/css/cardcreator.css" rel="stylesheet">\
			<link href="../../public/css/cardcreator_generator.css" rel="stylesheet">\
		</head><body>'
		+ htmlData +
		'</body></html>';
		
		fs.writeFile(__dirname+"/../data/cardhtml/"+self._id+".html", htmlData, function(err) {
			if (err) throw err;
			
			var url = "file:/"+__dirname+"/../data/cardhtml/"+self._id+".html"
			
			self.save(function(err) {
				if (err) throw err;
		
				console.log("Loading. "+url)
				
				try {
					var proc = exec('webkit2png -o '+__dirname+'/../public/businesscards/'+self._id+'.png -x 500 250 "'+url+'"')
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