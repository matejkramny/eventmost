$(function() {
	if(typeof INIT_GEO != 'undefined' && INIT_GEO){
		Geo.init();	
	}
	
	$('#geoNear').bind('click',function(){
		Geo.init();
	});
	
	
});

Geo = {
		isSupported:function(){
			if (navigator.geolocation) {
				return true;
			}
			return false;
		},
		getLocation:function(success,error){
			navigator.geolocation.getCurrentPosition(success,error);	
		},
		errorMessage:function(error){
			msg = '';
			switch(error.code) 
		    {
		    case error.PERMISSION_DENIED:
		      msg="User denied the request for Geolocation."
		      break;
		    case error.POSITION_UNAVAILABLE:
		    	msg="Location information is unavailable."
		      break;
		    case error.TIMEOUT:
		    	msg="The request to get user location timed out."
		      break;
		    case error.UNKNOWN_ERROR:
		    	msg="An unknown error occurred."
		      break;
		    }
			return msg;
		},
		init:function(){
			if(Geo.isSupported()){
				Geo.getLocation(function(position){
					window.location = window.location+'?lat='+position.coords.latitude+'&lng='+ position.coords.longitude;
				},function(error){
					//msg = Geo.errorMessage(error)
					//$('.geo-error').html(msg);
					//IP fallback
					if(IP.lat && IP.lng){
						window.location = window.location+'?lat='+IP.lat+'&lng='+ IP.lng;
					}
					
				});
			} else {
				//IP fallback
				if(IP.lat && IP.lng){
					window.location = window.location+'?lat='+IP.lat+'&lng='+ IP.lng;
				}
			}
		}
		
}
function getLocation() {
	if (navigator.geolocation) {
		
	} else {
		x.innerHTML = "Geolocation is not supported by this browser.";
	}
}
function showPosition(position) {
	x.innerHTML = "Latitude: " + position.coords.latitude
			+ "<br>Longitude: " + position.coords.longitude;
}



