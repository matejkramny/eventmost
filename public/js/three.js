$(document).ready(function() {
	$("body").on('click', "a[href='#']", function(e) {
		// prevents the page from scrolling up
		e.preventDefault();
		return false;
	})
	
	// Dropdown toggles
	$(".dropdown dt a, .dropdown2 dt a, .dropdown3 dt a, .dropdown4 dt a, .dropdown5 dt a, .dropdown6 dt a, .dropdown7 dt a, .dropdown8 dt a, .dropdown12 dt a").click(function() {
		$(this).parent().parent().find("dd ul").toggle();
	});
	
	$(".dropdown dd ul li a, .dropdown2 dd ul li a, .dropdown3 dd ul li a, .dropdown4 dd ul li a, .dropdown5 dd ul li a, .dropdown6 dd ul li a, .dropdown12 dd ul li a").click(function() {
		var text = $(this).html();
		$(this).parentsUntil('.dropdown,.dropdown2,.dropdown3,.dropdown4,.dropdown5,.dropdown6,.dropdown12').parent().find("dt a").html(text);
		$(this).parentsUntil('ul').parent().hide();
	});
	
	$(document).bind('click', function(e) {
		var $clicked = $(e.target);
		if (! $clicked.parent().hasClass("dropdown")) {
			$(".dropdown dd ul, .dropdown2 dd ul, .dropdown3 dd ul, .dropdown4 dd ul, .dropdown5 dd ul, .dropdown6 dd ul, .dropdown7 dd ul, .dropdown8 dd ul, .dropdown12 dd ul").hide();
		}
	});
	
	// use current location button
	$eventlocation = $("#event_location");
	$("#css3").click(function() {
		if (!$(this).is(':checked')) {
			return;
		}
		
		$eventlocation.val("Getting your location..")
		if (window.Geo.isSupported()) {
			window.Geo.getLocation(function(coords, pos) {
				$("#lat").val(coords.lat)
				$("#lng").val(coords.lng)
				
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