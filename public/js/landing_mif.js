$(document).ready(function() {
	var eventid = null;// used when event is created by ajax
	var lat, lng;
	var isLoading = false;	
	var editingEvent = null
	
	function getNear(coords) {
		lat = coords.lat;
		lng = coords.lng;
		
		$(".current-location-status").html("Googling..");
		
		$.ajax({
			url: "/rgeocode.json?latlng="+coords.lat+","+coords.lng,
			dataType: "json",
			method: "GET",
			success: function(data, status, jqxhr) {
				if (data.results.length > 0) {
					$(".current-location-field").val(data.results[0].formatted_address);
					$(".current-location-status").html("use current location")
				} else {
					$(".current-location-status").html("Location unavailable :(")
				}
			}
		});
	}
	
	$(".current-location-field").blur(function() {
		var address = $(this).val();
		if (address.length == 0) {
			return;
		}
		
		$(".current-location-status").html("Googling..");
		
		$.ajax({
			url: "/geocode.json?address="+address,
			dataType: "json",
			success: function(data, status, jqxhr) {
				if (data.results.length > 0) {
					$(".current-location-field").val(data.results[0].formatted_address);
					var geo = data.results[0].geometry.location;
					lat = geo.lat;
					lng = geo.lng;
					
					$(".current-location-status").html("use current location")
				} else {
					$(".current-location-status").html("Location unavailable :(")
				}
			}
		})
	})
	
	var loadNear = function() {
		$(".current-location-status").html("Locating..");
		
		if (window.Geo.isSupported()) {
			window.Geo.getLocation(function(coords, pos) {
				if (isLocalStorageCapable) {
					//HTML5 storage...
					localStorage["didSaveCoords"] = true;
					localStorage["coords"] = JSON.stringify(coords);
					localStorage["coordsSaved"] = Date.now();
				}
				
				getNear(coords);
			}, function(err) {
				var msg = Geo.errorMessage(err);
				$(".current-location-status").html("Location Unavailable :(");
			});
		} else {
			$placeholderText.html("Geolocalization not supported by your browser");
		}
	}
	
	// Event location for desktop
	$("#creditcardsmaller3, #creditcardsmaller223").change(function() {
		if ($(this).is(':checked')) {
			if (isLocalStorageCapable && localStorage["didSaveCoords"]) {
				var coordsSaved = parseInt(localStorage["coordsSaved"]);
				if (isNaN(coordsSaved) || Date.now() - (60 * 60 * 6 * 1000) > coordsSaved) {
					loadNear()
				} else {
					getNear(JSON.parse(localStorage["coords"]));
				}
			} else {
				loadNear()
			}
		}
	})

	$('#descButton').click(function(){
		$('.description-text-medium').html($(editor.i.contentWindow.document.body)[0].innerHTML);

		console.log($(editor.i.contentWindow.document.body)[0].innerHTML);
		//alert($(editor.i.contentWindow.document.body)[0].innerHTML);
		//return;

		if (isLoading)
			return;
	
		isLoading = true;
		$what = 'desc';
		$val1 = $(editor.i.contentWindow.document.body)[0].innerHTML;
		$val2 = "";
		$val3 = "";
		$val4 = "";

		saveEvPart($what, $val1, $val2, $val3, $val4);
		isLoading = false;
		return;
	});
	
	//TINY editor
	var editor = new TINY.editor.edit('editor', {
		id: 'tinyeditor',
		height: 175,
		cssclass: 'tinyeditor',
		controlclass: 'tinyeditor-control',
		rowclass: 'tinyeditor-header',
		dividerclass: 'tinyeditor-divider',
		controls: ['bold', 'italic', 'underline', 'strikethrough', 'leftalign', 'centeralign', 'rightalign', 'blockjustify', 'font', 'size',],
		footer: true,
		content: $('.description-text-medium').html(),
		fonts: ['Raleway', 'Verdana','Arial','Georgia','Trebuchet MS'],
		xhtml: true,
		cssfile: '/css/tinymce.iframe.css',
		bodyid: 'editor',
		footerclass: 'tinyeditor-footer',
		resize: {
			cssclass: 'resize'
		}
	});
	
	// Datepicker
	$(".datepickerWrapper .nowButton").click(function(ev) {
		ev.preventDefault();
		
		var now = new Date();
		var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2);
		$(this).parent().parent().parent().find('input[type=time]').val(time)
		
		return false;
	})
	
	$('#timeButton').click(function(){
		//$('#eventStartDate').html(new Date(getTime($('.datepicker')[0])) +"");
		//$('#eventEndDate').html(new Date(getTime($('.datepicker')[1])) +" ");

		var fromDate = new Date(getTime($('.datepicker')[0]));
		var toDate = new Date(getTime($('.datepicker')[1]));
		$('#eventStartDate').html(fromDate +"  ");
		$('#eventEndDate').html(toDate +" ");

		//start: getTime($form.find('.datepicker')[0]),
		//end: getTime($form.find('.datepicker')[1]),

		if (isLoading)
			return;
	
		isLoading = true;
		$what = 'when';
		$val1 = getTime($('.datepicker')[0]);
		$val2 = getTime($('.datepicker')[1]);
		$val3 = "";
		$val4 = "";

		saveEvPart($what, $val1, $val2, $val3, $val4);
		isLoading = false;
		return;
	});	

	$('#locationButton').click(function(){
		$('#venuname').html($('#modalvenue').val());
		$('#eventaddr').html($('#autocomplete').val());

		if (isLoading)
			return;
	
		isLoading = true;
		$what = 'where';
		$val1 = $('#modalvenue').val();
		$val2 = $('#autocomplete').val();

		$.ajax({
			url: "/geocode.json?address="+$val2,
			dataType: "json",
			success: function(data, status, jqxhr) {
				if (data.results.length > 0) {
					var geo = data.results[0].geometry.location;
					lat = geo.lat;
					lng = geo.lng;
					saveEvPart($what, $val1, $val2, lat, lng);
				} else {
					lat = null;
					lng = null;
					saveEvPart($what, $val1, $val2, lat, lng);
				}
			}
		})

		isLoading = false;
		return;
	});	


	function saveEvPart(what, val1, val2, val3, val4)
	{
		data = {
			_csrf: $("head meta[name=_csrf]").attr('content'),
			what: what,
			val1: val1,
			val2: val2,
			val3: val3,
			val4: val4
		}

		//alert(eventid);
		//alert(what);
		console.log(data);

		$.ajax({
			dataType: "json",
			url: "/event/"+eventid+"/editevpart",
			type: "POST",
			data: data,
			success: function(data, status) {
				isLoading = false;
				/*if (data.status != 200) {
					var errs = "<ul style='list-style:none;'>";
					for (var i = 0; i < data.err.length; i++) {
						errs += "<li>"+data.err[i]+"</li>";
					}
					errs += "</ul>";
					$("#submitStatus").html("Sorry, the event could not be created due to the following errors:<br/>"+errs);
					return;
				}*/
				
			},
			error: function(xhr, status, error) {
				isLoading = false;
			}
		})
	}

	/*
	$('#editTimeButton').click(function(){
		var str = $('#eventStartDate').text();
		//console.log(str);
		var d = Date.parse(str);
		//console.log(d);
		//console.log(d.getDate());
		//console.log(d.getMonth());

		//alert($('#eventStartDate').html());
		//console.log(Date.parse($('#eventStartDate').text()));

		function onselect(date, $this, $timePicker) {
			var dateString = date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear() + " " + $timePicker.val();
			$($this).parent().find(".datepickerResult").html(dateString);
		}
		
		$('#fromDateDesktop').each(function() {
			var self = this;
			$(this).datepicker({
				inline: true,
				defaultDate: "09/14/2014",
				//nextText: '&rarr;',
				//prevText: '&larr;',
				showOtherMonths: true,
				//dateFormat: 'dd MM yy',
				dayNamesMin: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
				//showOn: "button",
				//buttonImage: "img/calendar-blue.png",
				//buttonImageOnly: true,
				onSelect: function() {
					var date = $(this).datepicker('getDate');
					onselect(date, $(this), $(this).parent().find("input[type=time]"));
				}
			});
			var date = $(this).datepicker('getDate');
			onselect(date, $(this), $(this).parent().find("input[type=time]"));
			
			$(this).parent().find("input[type=time]").change(function() {
				onselect($(self).datepicker('getDate'), $(self), $(this));
			});
		});

		$('#toDateDesktop').each(function() {
			var self = this;
			$(this).datepicker({
				inline: true,
				defaultDate: Date.parse($('#eventEndDate').text()),
				//nextText: '&rarr;',
				//prevText: '&larr;',
				showOtherMonths: true,
				//dateFormat: 'dd MM yy',
				dayNamesMin: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
				//showOn: "button",
				//buttonImage: "img/calendar-blue.png",
				//buttonImageOnly: true,
				onSelect: function() {
					var date = $(this).datepicker('getDate');
					onselect(date, $(this), $(this).parent().find("input[type=time]"));
				}
			});
			var date = $(this).datepicker('getDate');
			onselect(date, $(this), $(this).parent().find("input[type=time]"));
			
			$(this).parent().find("input[type=time]").change(function() {
				onselect($(self).datepicker('getDate'), $(self), $(this));
			});
		});

	});

	*/	

	$('#editLocationButton').click(function(){
		//$('#modalvenue').val($('#venuname').html());
		//$('#autocomplete').val($('#eventaddr').html());
	});	
	
	function getTime (datepicker) {
		var dpicker = $(datepicker);
		var time = dpicker.parent().find("input[type=text]").val();
		var split = time.split(':')
		
		var hours = 0;
		var minutes = 0;
		if (split.length == 2) {
			hours = parseInt(split[0])
			minutes = parseInt(split[1])
		}
		
		var date = dpicker.datepicker('getDate');
		date.setHours(hours)
		date.setMinutes(minutes)
		return date.getTime();
	}

	// Edit event
	if (window.emEvent) {
		editingEvent = window.emEvent;
		var ev = editingEvent;
		eventid = ev._id;
		
		// address & geolocation
		$(".current-location-field").val(ev.address);
		if (ev.geo && ev.geo.geo) {
			lat = ev.geo.geo.lat;
			lng = ev.geo.geo.lng;
		}
		
		// avatar
		if (ev.avatar) {
			avatar_id = ev.avatar._id;
			$(".avatar_preview").attr('src', ev.avatar.url);
		}
		
		// name
		$('form input[name=eventName]').val(ev.name)
		// venue name
		$('form input[name=venueName]').val(ev.venue_name)
		
		// Dates
		var date = new Date(ev.start);
		var time = ('0' + date.getHours()).slice(-2) + ":" + ('0' + date.getMinutes()).slice(-2);
		$('#fromDateMobile, #fromDateDesktop').parent().find('input[type=text]').val(time);
		$('#fromDateMobile, #fromDateDesktop').datepicker("setDate", date);
		
		date = new Date(ev.end)
		time = ('0' + date.getHours()).slice(-2) + ":" + ('0' + date.getMinutes()).slice(-2);
		$('#toDateMobile, #toDateDesktop').parent().find('input[type=text]').val(time)
		$('#toDateMobile, #toDateDesktop').datepicker("setDate", date);
		
		// Description
		$(editor.i.contentWindow.document.body)[0].innerHTML = ev.description || ""
		//$(editor1.i.contentWindow.document.body)[0].innerHTML = ev.description || ""
		
		// Categories
		$(".selectedCategoriesList span").each(function() {
			removeCategory($(this), $(this).attr("val"))
		})
		for (var i = 0; i < ev.categories.length; i++) {
			//addCategory(ev.categories[i])
		}
		
		$('.allowAttendeesToCreateTheirOwnCategories').attr('checked', ev.allowAttendeesToCreateCategories || false);
		if (ev.pricedTickets) {
			$('.includePricedTickets').trigger('click')
		}
		// Private event
		if (ev.privateEvent) {
			$('.privateEvent').trigger('click')
		}
		
		$scope = angular.element($("#tickets")).scope();
		$scope.tickets = ev.tickets;
		for (var i = 0; i < $scope.tickets.length; i++) {
			var s = new Date($scope.tickets[i].start);
			var e = new Date($scope.tickets[i].end);
			
			var month = s.getMonth() + 1;
			var day = s.getDate();
			var hrs = s.getHours();
			var min = s.getMinutes();
			if (month < 10) month = "0"+month;
			if (day < 10) day = "0"+day;
			if (hrs < 10) hrs = "0"+hrs;
			if (min < 10) min = "0"+min;
			$scope.tickets[i].start_date = s.getFullYear() + "-" + month + "-" + day;
			$scope.tickets[i].start_time = hrs + ":" + min;
			
			var month = e.getMonth() + 1;
			var day = e.getDate();
			var hrs = e.getHours();
			var min = e.getMinutes();
			if (month < 10) month = "0"+month;
			if (day < 10) day = "0"+day;
			if (hrs < 10) hrs = "0"+hrs;
			if (min < 10) min = "0"+min;
			$scope.tickets[i].end_date = e.getFullYear() + "-" + month + "-" + day;
			$scope.tickets[i].end_time = hrs + ":" + min;
		}
		if ($scope.tickets.length == 0) {
			$scope.tickets.push($scope.defaultTicket)
		}
		
		if (!$scope.$$phase) {
			$scope.$digest();
		}
		
		$('.eventSubmitBtn').html('Save Event')
	} else {
		
		
		$('#fromDateMobile, #fromDateDesktop').parent().find('input[type=time]').val('00:00');
		$('#toDateMobile, #toDateDesktop').parent().find('input[type=time]').val('23:59');
	}


	function buildFormData($what, $val1, $val2) {
		//var allowCreateCategories = false;
		//if ($form.find(".allowAttendeesToCreateTheirOwnCategories").is(':checked')) {
		//	allowCreateCategories = true;
		//}
		//var pricedTickets = false;
		//if ($form.find(".includePricedTickets").is(':checked')) {
		//	pricedTickets = true;
		//}
		//var privateEvent = false;
		//if ($form.find(".privateEvent").is(':checked')) {
		//	privateEvent = true;
		//}
		
		//var scope = angular.element($("#tickets")).scope();
		//var tickets = scope.tickets;
		//for (var i = 0; i < tickets.length; i++) {
		//	tickets[i].start = new Date(tickets[i].start_date + " " + tickets[i].start_time)
		//	tickets[i].end = new Date(tickets[i].end_date + " " + tickets[i].end_time);
		//}
		
		//var ed = $form.find('#tinyeditor').length > 0 ? editor : editor1;
		switch($what)
		{
			case "where":
				var d = {
					_csrf: $("head meta[name=_csrf]").attr('content'),
					venue_name: $val1,
					location: $val2
				};
				break;
		}

		console.log(d);
		
		return d;
	} 
});
