function formatEvent(event) {
	event.start = new Date(event.start);
	if (event.address == null || event.address.length == 0) {
		event.address = "<h1>Location unavailable</h1>";
	}
	var avatar = "/images/event-avatar-new.svg";
	if (event.avatar && event.avatar.url)
		avatar = event.avatar.url;
	
	if (!event.description) {
		event.description = "";
	}
	if (!event.venue_name) {
		event.venue_name = "";
	}
	var html = '<div class="nspacer col-md-12 col-xs-12 col-lg-12 col-sm-12">\
        <div style="width:101.4%;" class="pull-left event"><a href="/event/'+event._id+'" class="slid-box">\
            <article class="c-two" style="background: url('+avatar+') top left; background-size: 100% 100%;">\
              <div class="slid-box-background">\
                <h4><div class="eye hide2"></div><br> REVIEW</h4>\
              </div>\
            </article>\
            <div class="col-lg-9 col-md-9 col-xs-9 psev pad-left-ten rbox eh">\
              <h4>'+event.name+'</h4>\
              <div class="smart-minus">'+event.description+'</div>\
            </div></a></div>\
      </div><div class="clearfix"></div>';
	return html;
}

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
			url: '/events/near?limit=5&lat='+coords.lat+'&lng='+coords.lng,
			method: 'GET',
			dataType: 'json',
			success: function(json, status, jqxhr) {
				var events = json.events;
		
				$placeholder.hide();
		
				for (event in events) {
					var ev = events[event];
			
					$placeholder.after(formatEvent(ev));
				}
		
				if (events.length == 0) {
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
	if (isLocalStorageCapable && localStorage["didSaveCoords"]) {
		getNear(JSON.parse(localStorage["coords"]));
		$("#tryAgainNearbyEvents").parent().addClass('hide');
	} else if ($("#tryAgainNearbyEvents").length == 0) {
		loadNear()
	}
})