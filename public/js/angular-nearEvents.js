var isLocalStorageCapable = false;
try {
	if ('localStorage' in window && window['localStorage'] !== null) {
		isLocalStorageCapable = true;
	}
} catch (e) {
}

$(document).ready(function() {
	$placeholder = $("#nearbyEventsPlaceholder");
	$placeholderText = $placeholder.find("p");
	
	function getNear (coords) {
		$.ajax({
			url: '/events/near?limit=5&html=1&lat='+coords.lat+'&lng='+coords.lng,
			method: 'GET',
			dataType: 'json',
			success: function(json, status, jqxhr) {
				$placeholder.hide();
				
				$placeholder.after(json.html);

				if (json.events.length == 0) {
					$placeholder.show();
					$placeholderText.html(":-( No events near you.. Go ahead and <a href='/event/add'>create one</a>!");
				}
			},
			error: function(jqxhr, status, error) {
				console.log("error" + error)
			}
		})
	}
	
	$(document).on('click', "#tryAgainNearbyEvents", function(ev) {
		ev.preventDefault();
		
		$(this).parent().addClass('hide');
		
		loadNear();
		
		return false;
	})
	
	var loadNear = function() {
		$placeholderText.html("Locating you..");
		$placeholder.show();
		
		if (window.Geo.isSupported()) {
			window.Geo.getLocation(function(coords, pos) {
				
				$placeholderText.html("Looking for events based on your location..");
				
				if (isLocalStorageCapable) {
					//HTML5 storage...
					localStorage["didSaveCoords"] = true;
					localStorage["coords"] = JSON.stringify(coords);
					localStorage["coordsSaved"] = Date.now();
				}
				
				getNear(coords);
			}, function(err) {
				var msg = Geo.errorMessage(err);
				$placeholderText.html(msg+"<br/><a id='tryAgainNearbyEvents' href='#'>Try again</a>");
			});
		} else {
			$placeholderText.html("Geolocalization not supported by your browser");
		}
	}
	var coordsSaved = parseInt(localStorage["coordsSaved"]);
	
	if (isNaN(coordsSaved) || Date.now() - (60 * 60 * 6 * 1000) > coordsSaved) {
		loadNear()
		$("#tryAgainNearbyEvents").parent().addClass('hide');
	} else if (isLocalStorageCapable && localStorage["didSaveCoords"]) {
		getNear(JSON.parse(localStorage["coords"]));
		$("#tryAgainNearbyEvents").parent().addClass('hide');
	} else if ($("#tryAgainNearbyEvents").length == 0) {
		loadNear()
	}
})