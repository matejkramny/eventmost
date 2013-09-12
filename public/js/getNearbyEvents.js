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

function formatEvent(event) {
	event.start = new Date(event.start);
	if (event.location == null || event.location.length == 0) {
		event.location = "<h1>Location unavailable</h1>";
	}
	var html = '\
	<div class="row-fluid">\
		<div class="events">\
			<div class="span1p">\
				<img src="/img/map-icon.svg" alt="">\
			</div>\
			<div class="span1">\
				<img src="'+event.avatar+'" alt="" class="minus">\
			</div>\
			<div class="span8p">\
				<h8><a href="/event/'+event._id+'">'+event.name+'</a></h8>\
				<p class="eventtext">'+event.description+'</p>\
			</div>\
			<div class="right_star">\
				<img src="/img/martini.svg" alt="" class="arrow">\
			</div>\
			<div class="right_star">\
				<div class="image2">\
					<img src="/img/calendar-icony.svg" alt="" class="image2">\
					<h16>'+event.start.getDate()+'.'+(event.start.getMonth()+1)+'<br/>'+event.start.getFullYear()+'</h16>\
				</div>\
			</div>\
			<div class="right_star">\
				<div class="left">\
					<img src="/img/clock.svg" alt="" class="arrow">\
				</div>\
				<div class="left date">\
					'+event.start.getHours()+':'+event.start.getMinutes()+'<br /> (BST)\
				</div>\
			</div>\
			<div class="left headerSpacer">\
				<div class="left">\
					<img src="/img/map6.svg" alt="" class="arrow">\
				</div>\
				<div class="left location">\
					'+event.location+'\
				</div>\
			</div>\
		</div>\
	</div>\
	<div class="line"></div>\
	<div class="clearfix"></div>\
	';
	return html;
}

$(document).ready(function() {
	$placeholder = $("#nearbyEventsPlaceholder");
	$placeholderText = $placeholder.find("p");
	$(document).on('click', "#tryAgainNearbyEvents", function(ev) {
		ev.preventDefault();
		
		loadNear();
		
		return false;
	})
	
	var loadNear = function() {
		$placeholderText.html("Looking for events..");
		$placeholder.show();
		
		if (window.Geo.isSupported()) {
			window.Geo.getLocation(function(coords, pos) {
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
			}, function(err) {
				var msg = Geo.errorMessage(err);
				$placeholderText.html(msg+"<br/><a id='tryAgainNearbyEvents' href='#'>Try again</a>");
			});
		} else {
			$placeholderText.html("Geolocalization not supported by your browser");
		}
	}
	loadNear();
})