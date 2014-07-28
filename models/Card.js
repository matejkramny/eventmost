var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;
var fs = require('fs')
	, exec = require('child_process').exec
	, config = require('../config')

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
			
			if (config.knox) {
				config.knox.putFile(config.path+"/data/cardhtml/"+self._id+".html", "/data/cardhtml/"+self._id+".html", function(err, res) {
					if (err) throw err;
					
					console.log("Uploaded Card .html File to S3");
					res.resume();
				});
			}
			
			self.save(function(err) {
				if (err) throw err;
		
				console.log("Loading. "+url)
				
				try {
					var proc = exec('fab -f '+config.path+'/scripts/create_card.py --password webkit2png -H root@127.0.0.1:2222 getCard:id="'+self._id+'"')
					proc.stdout.on('data', function(chunk) {
						console.log(chunk)
					})
					proc.stderr.on('data', function(chunk) {
						console.log(chunk)
					})
					proc.on('close', function(code) {
						console.log("Done, code "+code);
						
						if (code != 0) {
							cb("Server Error");
							return;
						}
						
						if (config.knox) {
							config.knox.putFile(config.path+'/public/businesscards/'+self._id+'.png', '/public/businesscards/'+self._id+'.png', function(err, res) {
								if (err) throw err;
								
								console.log("Uploaded Business Card Picture to S3");
								res.resume();
							})
						}
						
						cb(null)
					})
				} catch (e) {
					console.log("Is fabric/webkit2png installed? http://snippets.aktagon.com/snippets/504-how-to-generate-screenshots-on-debian-linux-with-python-webkit2png")
					cb("Internal Server Error");
				}
			})
		})
	})
}

exports.Card = mongoose.model("Card", scheme);