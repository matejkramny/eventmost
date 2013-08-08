var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;
var fs = require('fs')

var scheme = schema({
	user: {
		type: ObjectId,
		ref: 'User'
	},
	name: String,
	surname: String,
	address: String,
	zip: String,
	city: String,
	avatar: { type: String, default: "/img/avatar.jpg" },
	phone: String,
	email: String,
	twitter: String,
	website: String,
	position: String,
	card_type: String,
	isDeleted: Boolean,
	deleted: Date
});

scheme.methods.getName = function () {
	return this.name + " " + this.surname;
}

scheme.methods.edit = function (card, body, user, files, cb) {
	card.user = user._id;
	card.name = body.name;
	card.surname = body.surname;
	card.address = body.address;
	card.zip = body.zipcode;
	card.city = body.city;
	card.phone = body.phone;
	card.email = body.email;
	card.twitter = body.twitter;
	card.website = body.website;
	card.position = body.position;
	card.card_type = body.card_type;
	
	var save = function () {
		card.save(function(err) {
			if (err) throw err;
			
			cb(null)
		})
	}
	
	if (files.avatar != null && files.avatar.name.length != 0) {
		var ext = files.avatar.type.split('/');
		var ext = ext[ext.length-1];
		
		card.avatar = "/avatars/"+card._id+"."+ext;
		
		fs.readFile(files.avatar.path, function(err, avatar) {
			fs.writeFile(__dirname + "/../public"+card.avatar, avatar, function(err) {
				if (err) throw err;
				
				save()
			});
		});
		return;
	} else {
		save()
	}
}

exports.Card = mongoose.model("Card", scheme);