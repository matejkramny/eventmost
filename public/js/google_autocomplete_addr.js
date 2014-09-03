
  // This example displays an address form, using the autocomplete feature
  // of the Google Places API to help users fill in the information.

  var placeSearch, autocomplete;
  var componentForm = {
    street_number: 'short_name',
    route: 'long_name',
    locality: 'long_name',
    administrative_area_level_1: 'short_name',
    country: 'long_name',
    postal_code: 'short_name'
  };

  function initialize() {
    // Create the autocomplete object, restricting the search
    // to geographical location types.
    autocomplete = new google.maps.places.Autocomplete(
        /** @type {HTMLInputElement} */(document.getElementById('autocomplete')),
        { types: ['geocode'] });
    // When the user selects an address from the dropdown,
    // populate the address fields in the form.
   
    var mapOptions = {
      center: new google.maps.LatLng(-33.8688, 151.2195),
      zoom: 8
      //mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map_canvas = document.getElementById('map-canvas');
    var map = new google.maps.Map(map_canvas, mapOptions);

    autocomplete.bindTo('bounds', map);
    var infowindow = new google.maps.InfoWindow();
    var marker = new google.maps.Marker({
          map: map
      });
    google.maps.event.addListener(autocomplete, 'place_changed', function() {      
      fillInAddress(infowindow, marker, map_canvas, map);
      //google.maps.event.trigger(map, 'resize');
    });
  }

  // [START region_fillform]
  function fillInAddress(infowindow, marker, map_canvas, map) {
    // Get the place details from the autocomplete object.
    var place = autocomplete.getPlace();

    infowindow.close();
    marker.setVisible(false);
    if (!place.geometry) {
      return;
    }

    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);  
    }
    
    marker.setIcon(({
      url: place.icon,
      size: new google.maps.Size(71, 71),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(17, 34),
      scaledSize: new google.maps.Size(35, 35)
    }));
    marker.setPosition(place.geometry.location);
    marker.setVisible(true);

    var address = '';
    if (place.address_components) {
      address = [
        (place.address_components[0] && place.address_components[0].short_name || ''),
        (place.address_components[1] && place.address_components[1].short_name || ''),
        (place.address_components[2] && place.address_components[2].short_name || ''),
        (place.address_components[4] && place.address_components[4].short_name || '')
      ].join(' ');
    }

    console.log(address)
    var src = "http://maps.google.com/maps?q=" + encodeURIComponent(address)+"&output=embed";
    $('#eventMap').find('iframe').attr({'src': src});

/*    if($scope.sublayerid !== 'undefined'){
        $scope.toolbar_maps_dom.find('iframe').attr({'src': src});
        layerLocalSorage.addLayer($scope.layerdir+"_"+$scope.layer+'_'+$scope.sublayerid, $scope.toolbar_maps_dom.wrap('<div></div>').parent().html());
    }
    else {
        console.log('hello');
        $scope.e_venue_map_dom.find('iframe').attr({'src': src});
        layerLocalSorage.addLayer($scope.layerdir+"_"+$scope.layer+'_map',  $scope.e_venue_map_dom.wrap('<div></div>').parent().html());
    } */
    
    infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
    infowindow.open(map, marker);


    for (var component in componentForm) {
      document.getElementById(component).value = '';
      document.getElementById(component).disabled = false;
    }

    // Get each component of the address from the place details
    // and fill the corresponding field on the form.
    for (var i = 0; i < place.address_components.length; i++) {
      var addressType = place.address_components[i].types[0];
      if (componentForm[addressType]) {
        var val = place.address_components[i][componentForm[addressType]];
        document.getElementById(addressType).value = val;
      }
    }
  }
  // [END region_fillform]

  // [START region_geolocation]
  // Bias the autocomplete object to the user's geographical location,
  // as supplied by the browser's 'navigator.geolocation' object.

  function geolocate() {
    if (navigator.geolocation) {
    //alert(333);

      navigator.geolocation.getCurrentPosition(function(position) {
        //alert(444);

        var geolocation = new google.maps.LatLng(
            position.coords.latitude, position.coords.longitude);
        console.log("geolocation");
        //autocomplete.setBounds(new google.maps.LatLngBounds(geolocation, geolocation));
      });
    }
  }
  // [END region_geolocation]
