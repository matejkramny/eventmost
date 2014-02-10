require('../app');

var models = require('../models'),
	async = require('async'),
	request = require('request'),
	config = require('../config'),
	fs = require('fs')
	
if (!config.knox) {
	console.log("Knox not configured!");
	process.exit(1);
}

function toUpload (dir, match, callback) {
	fs.readdir(config.path+dir, function(err, files) {
		
		var _files = [];
		for (var i = 0; i < files.length; i++) {
			if (files[i].match(match)) {
				_files.push(files[i]);
			}
		}
		
		files = _files;
		
		async.reject(files, function(file, cb) {
			fs.stat(config.path+dir+'/'+file, function(err, stat) {
				if (err) throw err;
				
				cb(stat.isDirectory());
			})
		}, function(files) {
			
			async.each(files, function(file, cb) {
				config.knox.putFile(config.path+dir+'/'+file, dir+'/'+file, function(err, res) {
					if (err) return cb(err);
					
					console.log("Put file "+file);
					
					res.resume();
					cb(null);
				})
			}, function(err) {
				if (err) throw err;
				
				console.log("Done with batch" + dir);
				callback(err)
			})
			
		})
	});
}

async.eachSeries(
	['avatars', 'businesscards', 'dropbox', 'profileavatars'],
	function(dir, cb) {
	toUpload('/public/'+dir, /^((?!empty).)*$/, cb);
}, function(err) {
	if (err) throw err;
	
	toUpload('/data/cardhtml', /^((?!empty).)*$/, function(err) {
		if (err) throw err;
		
		console.log("Finished")
	})
})