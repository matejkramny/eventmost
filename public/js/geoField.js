App.checkSwitches();

if(Geo.isSupported()){
	Geo.getLocation(function(data){
		params = {};
		params.latlng =  data.coords.latitude+','+data.coords.longitude;
		AjaxClient.rgeocode(params,function(data){
			if(data.length){
				$('#latlng').show();
				
				for(i in data){
					loc = data[i];
					//$('#formatted_address').html(loc.formatted_address+' ('+loc.geometry.location.lat+','+loc.geometry.location.lng+')');
					$('#EventAddress').val(loc.formatted_address);
					$('#lat').val(loc.geometry.location.lat);
					$('#lng').val(loc.geometry.location.lng);
					break;
				}
			} else {
				$('#formatted_address').html('not found');
			}
		});
	},
	function(error){
		$('#latlng').after('<div class="geoinfo">Geolocalization is disabled or not supported by your browser.</div>');
	})
}