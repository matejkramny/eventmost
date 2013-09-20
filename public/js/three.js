$(document).ready(function() {
	// Dropdown toggles
	$(".dropdown dt a, .dropdown2 dt a, .dropdown3 dt a, .dropdown4 dt a, .dropdown5 dt a").click(function() {
		$(this).parent().parent().find("dd ul").toggle();
	});
	
	$(".dropdown dd ul li a, .dropdown2 dd ul li a, .dropdown3 dd ul li a, .dropdown4 dd ul li a, .dropdown5 dd ul li a").click(function() {
		var text = $(this).html();
		$(this).parentsUntil('.dropdown,.dropdown2,.dropdown3,.dropdown4,.dropdown5').parent().find("dt a").html(text);
		$(this).parentsUntil('ul').parent().hide();
	});
	
	$(document).bind('click', function(e) {
		var $clicked = $(e.target);
		if (! $clicked.parent().hasClass("dropdown")) {
			$(".dropdown dd ul, .dropdown2 dd ul, .dropdown3 dd ul, .dropdown4 dd ul, .dropdown5 dd ul").hide();
		}
	});
	
	// use current location button
	$eventlocation = $("#event_location");
	$("#css3").click(function() {
		$eventlocation.val("Getting your location..")
		if (window.Geo.isSupported()) {
			window.Geo.getLocation(function(coords, pos) {
				$.ajax({
					url: '/rgeocode.json?latlng='+coords.lat+','+coords.lng,
					method: 'GET',
					dataType: 'json',
					success: function(json, status, jqxhr) {
						if (json && json.length > 0) {
							$eventlocation.val(json[0].formatted_address);
						} else {
							// no results
							$eventlocation.val("Location unavailable")
						}
					},
					error: function(jqxhr, status, error) {
						console.log("error" + error)
					}
				})
			}, function(err) {
				var msg = Geo.errorMessage(err);
				$eventlocation.val("Sorry, we can't detect your location");
			});
		} else {
			$eventlocation.val("Geolocalization not supported by your browser");
		}
	})
});