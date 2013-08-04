function updateNear(params){
	var link =  $('.location-item a').attr('href')
    link+="?lat="+params.lat+"&lng="+params.lng;
    $('.location-item a').attr('href',link);
	
    AjaxClient.eventsNear(params,function(data){
      $('#events-number').html(data.length);
      $('#events-number2').show();
      $('#arrow-red').attr('src','/img/white-arrow.png');
      $('.location-item').addClass('has-near-events');
    });
}

if(Geo.isSupported()){
  Geo.getLocation(function(position){
    params = {};
    params.lat = position.coords.latitude;
    params.lng = position.coords.longitude;
    params.limit=50;
    params.distance = 30;
    updateNear(params);
  },function(error){
	  if(IP.lat && IP.lng){
		    params = {};
		    params.lat = IP.lat;
		    params.lng = IP.lng;
		    params.limit=50;
		    params.distance = 30;
		    updateNear(params);

		} else {
			msg = Geo.errorMessage(error)
		    $('#events-in-range .left').html(msg);
		    $('#events-in-range .red-arrow').hide();		
		}
    
  }) 

} else {
	if(IP.lat && IP.lng){
	    params = {};
	    params.lat = IP.lat;
	    params.lng = IP.lng;
	    params.limit=50;
	    params.distance = 30;
	    updateNear(params);
	} else {
		$('#events-in-range .left').html('Your browser dosen\'t support geolocalization');
		$('#events-in-range .red-arrow').hide();	
	}
  
}