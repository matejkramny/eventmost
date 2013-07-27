exports.ip2long = function(ip_address) {
    // Converts a string containing an (IPv4) Internet Protocol dotted address into a proper address  
    // 
    // version: 901.714
    // discuss at: http://phpjs.org/functions/ip2long
    // +   original by: Waldo Malqui Silva
    // +   improved by: Victor
    // *     example 1: ip2long( '192.0.34.166' );
    // *     returns 1: 3221234342
	
	var output = false;
	var parts = [];
	if (ip_address.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
		parts  = ip_address.split('.');
		output = ( parts[0] * 16777216 +
			( parts[1] * 65536 ) +
			( parts[2] * 256 ) +
			( parts[3] * 1 ) );
	}
	return output;
}