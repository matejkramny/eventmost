var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var scheme = schema({
	price: { type: Number, required: true },
	quantity: { type: Number, required: true },
	name: String,
	description: String,
	hasSaleDates: Boolean,
	start: Date,
	end: Date,
	showRemainingTickets: Boolean,
	min_per_order: { type: Number, min: 0 },
	max_per_order: Number,
	discountCodes: [{
		code: String,
		discount: { type: Number, min: 1, max: 100 }
	}]
})

scheme.methods.update = function (body) {
	if (typeof body.price !== "undefined") {
		var price = parseFloat(body.price);
		if (!isNaN(price) && price >= 0) {
			this.price = price;
		}
	}
	if (typeof body.quantity !== "undefined") {
		var quantity = parseInt(body.quantity);
		if (!isNaN(quantity) && quantity >= 0) {
			this.quantity = quantity;
		}
	}
	if (typeof body.name !== "undefined") {
		this.name = body.name;
	}
	if (typeof body.description !== "undefined") {
		this.description = body.description;
	}
	if (typeof body.hasSaleDates !== "undefined") {
		this.hasSaleDates = body.hasSaleDates == "true" ? true : false;
	}
	
	if (typeof body.start !== "undefined") {
		var d = new Date(body.start);
		if (!isNaN(d.getTime())) {
			this.start = d;
		}
	}
	if (typeof body.end !== "undefined") {
		var d = new Date(body.end);
		if (!isNaN(d.getTime())) {
			this.end = d;
		}
	}
	
	if (typeof body.showRemainingTickets !== "undefined") {
		this.showRemainingTickets = body.showRemainingTickets == "true" ? true : false;
	}
	if (typeof body.min_per_order !== "undefined") {
		var min_per_order = parseInt(body.min_per_order);
		if (!isNaN(min_per_order) && min_per_order >= 0) {
			this.min_per_order = min_per_order;
		}
	}
	if (typeof body.max_per_order !== "undefined") {
		var max_per_order = parseInt(body.max_per_order);
		if (!isNaN(max_per_order) && max_per_order >= 0) {
			this.max_per_order = max_per_order;
		} else {
			this.max_per_order = 0;
		}
	}
	
	if (typeof body.discountCodes !== "undefined") {
		this.discountCodes = [];
		for (var i = 0; i < body.discountCodes.length; i++) {
			var discount = body.discountCodes[i];
		
			var code = "";
			var percentOff = 0;
			if (discount.code.length > 0) {
				code = discount.code;
			}
			if (discount.discount.length > 0) {
				percentOff = parseFloat(discount.discount);
			}
		
			if (code.length > 0 && !isNaN(percentOff) && percentOff > 0 && percentOff <= 100) {
				this.discountCodes.push({
					code: code,
					discount: percentOff
				})
			}
		}
	}
}

exports.Ticket = mongoose.model("Ticket", scheme);