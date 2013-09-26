function formatEvent(event) {
	event.start = new Date(event.start);
	if (event.address == null || event.address.length == 0) {
		event.address = "<h1>Location unavailable</h1>";
	}
	var avatar = event.avatar.url || "/img/default-logo.svg";
	if (!event.description) {
		event.description = "";
	}
	var html = '\
	<div class="row-fluid">\
		<div class="events">\
			<div class="span1p">\
				<img src="/img/map-icon.svg" alt="">\
			</div>\
			<div class="span1">\
				<img src="'+avatar +'" alt="" class="minus">\
			</div>\
			<div class="span8p">\
				<a href="/event/'+event._id+'"><h8>'+event.name+'</h8></a>\
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
					<h1>'+event.address+'</h1>\
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