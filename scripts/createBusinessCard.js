var system = require('system'),
env = system.env

var url = env.PHANTOM_WEBPAGE;
var id = env.PHANTOM_CARD_ID;
console.log(url);
console.log(id);

var page = require('webpage').create();

console.log("Loading..")
page.viewportSize = { width: 500, height : 250 };
page.open(url, function(status) {
	if (status === 'success') {
		console.log("Succeeded")
		
		page.render('./../public/businesscards/'+id+'.png');
		phantom.exit()
	}
	
	console.log("Failed "+status)
	phantom.exit()
})