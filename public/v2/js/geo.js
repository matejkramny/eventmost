window.Geo = {
	isSupported: function() {
		if (navigator.geolocation) {
			return true;
		}
		
		return false;
	},
	getLocation: function(success, error) {
		navigator.geolocation.getCurrentPosition(function(pos) {
			success({
				lat: pos.coords.latitude,
				lng: pos.coords.longitude
			}, pos)
		}, error);	
	},
	errorMessage: function(error) {
		msg = '';
		
		switch(error.code) {
			case error.PERMISSION_DENIED:
				msg = "You denied request for Geolocation."
				break;
			case error.POSITION_UNAVAILABLE:
				msg = "Location information is unavailable."
				break;
			case error.TIMEOUT:
				msg = "The request to get user location timed out."
				break;
			default:
			case error.UNKNOWN_ERROR:
				msg = "An unknown error occurred."
				break;
		}
		
		return msg;
	}
}