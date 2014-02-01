$(document).ready(function() {
	var eventid = null;// used when event is created by ajax
	var lat, lng;
	
	var isLocalStorageCapable = false;
	try {
		if ('localStorage' in window && window['localStorage'] !== null) {
			isLocalStorageCapable = true;
		}
	} catch (e) {
	}
	
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
				getNear(JSON.parse(localStorage["coords"]));
			} else {
				loadNear()
			}
		}
	})
	
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
		fonts: ['Raleway', 'Verdana','Arial','Georgia','Trebuchet MS'],
		xhtml: true,
		cssfile: '/css/tinymce.iframe.css',
		bodyid: 'editor',
		footerclass: 'tinyeditor-footer',
		resize: {
			cssclass: 'resize'
		}
	});
	//TINY editor
	var editor1 = new TINY.editor.edit('editor', {
		id: 'tinyeditor1',
		height: 175,
		cssclass: 'tinyeditor',
		controlclass: 'tinyeditor-control',
		rowclass: 'tinyeditor-header',
		dividerclass: 'tinyeditor-divider',
		controls: ['bold', 'italic', 'underline', 'strikethrough', 'leftalign', 'centeralign', 'rightalign', 'blockjustify', 'font', 'size',],
		footer: true,
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
	
	// Enable categories
	$enablecategoriesNo = $("#cbox8")
	$enablecategoriesYes = $("#cbox7")
	
	$enablecategoriesNo.click(function() {
		$enablecategoriesNo.attr('checked', true);
		$enablecategoriesYes.attr('checked', false);
	})
	$enablecategoriesYes.click(function() {
		$enablecategoriesNo.attr('checked', false);
		$enablecategoriesYes.attr('checked', true);
	})
	
	// Ticket table thing
	$ticketstable = $('#tickets-table');
	$ticketsno = $("#cbox10");
	$ticketsyes = $("#cbox9");
	
	function enableTicketsTable(enable) {
		if (enable === true) {
			$ticketstable.find(".disabled-image, .disabled-lock").css("display", "none");
			$ticketsno.attr('checked', false);
			$ticketsyes.attr('checked', true);
		} else {
			$ticketstable.find(".disabled-image, .disabled-lock").css("display", "inline");
			$ticketsno.attr('checked', true);
			$ticketsyes.attr('checked', false);
		}
	}
	
	$ticketsno.click(function() {
		var checked = false;
		enableTicketsTable(checked);
	})
	$ticketsyes.click(function() {
		var checked = true;
		enableTicketsTable(checked);
	})
	
	// Avatar upload
	var avatarUploadRequest;
	var avatar_id;
	var file;
	$("#file_browse").change(function() {
		var files = this.files;
		
		for (var i = 0; i < files.length; i++) {
			file = files[i];
			break;
		}
		
		if (typeof file === "undefined" || file == null) {
			return;
		}
		
		var ext = file.name.split('.');
		var extensionValid = false;
		
		if (ext.length > 0) {
			ext = ext[ext.length-1].toLowerCase();
			
			// Check against valid extensions
			if (ext == 'jpg' || ext == 'jpeg' || ext == 'png' || ext == 'gif') {
				// valid.
				extensionValid = true;
			}
		}
		
		if (!extensionValid) {
			alert("The file is not valid :/. Please choose an image, thank you.");
			return;
		}
		
		var reader = new FileReader();
		reader.onload = function(img) {
			$(".avatar_preview").attr('src', img.target.result);
		}
		reader.readAsDataURL(file);
		
		uploadAvatar()
	})
	
	$(".file_browse_wrapper").click(function(ev) {
		ev.preventDefault();
		$("#file_browse").trigger('click');
		return false;
	})
	function uploadAvatar () {
		if (typeof file === "undefined" || file == null) {
			// opens the dialog
			$("#file_browse").trigger('click');
			return;
		}
	
		$("#avatarStatus").html("<br/>Uploading..");
	
		var form = new FormData();
		form.append("_csrf", $("head meta[name=_csrf]").attr('content'));
		form.append("avatar", file);
		avatarUploadRequest = new XMLHttpRequest();
		avatarUploadRequest.open("POST", "/event/add/avatar", true);
		avatarUploadRequest.responseType = "json";
		avatarUploadRequest.setRequestHeader("accept", "application/json");
		avatarUploadRequest.onreadystatechange = xmlhttprequestResponse;
		avatarUploadRequest.upload.addEventListener('progress', xmlUploadProgress, false)
		avatarUploadRequest.send(form);
	}
	$(".file_upload_wrapper").click(uploadAvatar);
	
	$(".file_delete_wrapper").click(function() {
		file = null;
		avatarUploadRequest = null;
		
		$("#avatar_preview").attr('src', '/images/default_logo.svg');
		
		var avId = $("#avatar_id").val();
		$("#avatar_id").val('');
		
		$("#file_browse").attr("name", "avatar");
		
		$("#avatarStatus").html("");
		
		if (avId.length == 0) {
			return;
		}
		
		$.ajax({
			url: "/event/"+avId+"/avatar/remove",
			type: "GET"
		})
	});
	
	function updateProgress(perc) {
		if (perc > 0) {
			$(".avatar-progress-upload").removeClass('progress-bar-success').parent().removeClass("hide")
		}
		
		$(".avatar-progress-upload").attr("aria-valuenow", perc).css("width", perc+"%").find("span").html(perc+"% Uploaded");
		
		if (perc >= 100) {
			$(".avatar-progress-upload").addClass("progress-bar-success").parent().addClass("hide");
		}
	}
	
	function xmlUploadProgress (ev) {
		if (ev.lengthComputable) {
			var percent = Math.round(ev.loaded * 100 / ev.total);
			updateProgress(percent)
		}
	}
	function xmlhttprequestResponse () {
		if (avatarUploadRequest.readyState == 4) {
			if (avatarUploadRequest.status == 200) {
				result = avatarUploadRequest.response;
				console.log(result);
				console.log(typeof result);
				if (result.status != 200) {
					alert("Could not upload image\n"+result.err);
				} else {
					// store the avatar id in the form.
					avatar_id = result.id;
					$("#avatarStatus").html("<br/>Uploaded");
				}
			} else {
				// Not ok
				alert(avatarUploadRequest.statusText);
			}
		}
	}
	
	// Categories & tickets
	$(".selectedCategoriesList").on('click', 'span', function(e) {
		e.preventDefault()
		
		var text = $(this).attr("val");
		removeCategory($(this), text);
		
		return false;
	})
	
	var categories = ["Guest Speaker"];
	var $ticketsWrapper = $(".ticketsWrapper")
	var $tickets = $("#tickets");
	var $ticketsLock = $(".tickets-lock");
	
	$ticketsLock.addClass('hide')
	setTimeout(function() {
		if ($("#2creditcardsmaller233").is(":checked")) {
			$ticketsLock.removeClass('hide')
		}
	}, 200)
	
	//Yes,No hiding/showing the #ticketsWrapper
	$("#2creditcardsmaller233, #creditcardsmaller233").change(function() {
		if ($(this).is(":checked")) {
			$("#1creditcardsmaller23, #creditcardsmaller23").attr("checked", false)
			$ticketsLock.removeClass("hide");
		} else {
			$("#1creditcardsmaller23, #creditcardsmaller23").attr("checked", "checked")
			$ticketsLock.addClass("hide");
		}
	})
	$("#1creditcardsmaller23, #creditcardsmaller23").change(function() {
		if ($(this).is(":checked")) {
			$("#2creditcardsmaller233, #creditcardsmaller233").attr("checked", false)
			$ticketsLock.addClass("hide");
		} else {
			$("#2creditcardsmaller233, #creditcardsmaller233").attr("checked", "checked")
			$ticketsLock.removeClass("hide");
		}
	})
	
	$("body").on("click", ".dropdown-update-link ul.dropdown-menu a", function(ev) {
		ev.preventDefault();
		
		$(this).parent().parent().parent().find("a.dropdown-toggle").html($(this).html()+"<b class=\"caret\"></b>")
		
		return true;
	})
	
	function addCategory (category) {
		for (var i = 0; i < categories.length; i++) {
			var cat = categories[i];
			if (cat == category) {
				// Duplicate. We don't want two same categories do we.
				return;
			}
		}
		
		//var template = $("#selectedCategoryListTemplate");
		//template.find(".guest").html(category);
		//template.find("input[type=hidden]").val(category);
		//var html = template.html();
		$(".selectedCategoriesList").append("<span val=\""+category+"\">"+category+"<br/></span>");
		
		categories.push(category);
		
		if (categories.length > 0) {
			$(".selectedCategoriesList .noneSelected").addClass('hide')
		}
	}
	
	function removeCategory ($category, category) {
		for (var i = 0; i < categories.length; i++) {
			var cat = categories[i];
			if (cat == category) {
				// Found it. Remove it.
				categories.splice(i, 1);
			}
		}
		
		$category.remove();
		
		if (categories.length == 0) {
			$(".selectedCategoriesList .noneSelected").removeClass("hide");
		}
	}
	
	$(".predefinedCategories span").click(function() {
		var text = $(this).attr("val");
		addCategory(text);
	})
	$(".createCategory a.add-category-manual").click(function(ev) {
		ev.preventDefault();
		
		var href = $(this).attr("href")
		var field = $(".createCategory input"+href)
		var val = field.val();
		if (val.length > 0) {
			addCategory(val);
			field.val("");
		}
		
		field.trigger('focus');
		
		return false;
	});
	
	function getValue(selector) {
		return $(selector).val();
	}
	function getTime (datepicker) {
		var dpicker = $(datepicker);
		var time = dpicker.parent().find("input[type=time]").val();
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
	function buildFormData($form) {
		var allowCreateCategories = false;
		if ($form.find(".allowAttendeesToCreateTheirOwnCategories").is(':checked')) {
			allowCreateCategories = true;
		}
		var allowCommentOnEvent = false;
		if ($form.find(".allowAttendeesToCommentOnTheEvent").is(':checked')) {
			allowCommentOnEvent = true;
		}
		var pricedTickets = false;
		if ($form.find(".includePricedTickets").is(':checked')) {
			pricedTickets = true;
		}
		
		var scope = angular.element($("#tickets")).scope();
		var tickets = scope.tickets;
		for (var i = 0; i < tickets.length; i++) {
			tickets[i].start = new Date(tickets[i].start_date + " " + tickets[i].start_time)
			tickets[i].end = new Date(tickets[i].end_date + " " + tickets[i].end_time);
		}
		
		var ed = $form.find('#tinyeditor').length > 0 ? editor : editor1;
		var d = {
			_csrf: $("head meta[name=_csrf]").attr('content'),
			name: $form.find('input[name=eventName]').val(),
			avatar: avatar_id,
			venue_name: $form.find('input[name=venueName]').val(),
			location: $form.find('input[name=address]').val(),
			lat: lat,
			lng: lng,
			start: getTime($form.find('.datepicker')[0]),
			end: getTime($form.find('.datepicker')[1]),
			description: $(ed.i.contentWindow.document.body)[0].innerHTML,
			categories: categories,
			allowAttendeesToCreateCategories: allowCreateCategories,
			allowCommentsOnEvent: allowCommentOnEvent,
			pricedTickets: pricedTickets,
			tickets: pricedTickets ? tickets : [],
		};
		console.log(d);
		
		return d;
	}
	
	var isLoading = false;
	$(".eventSubmitBtn").click(function() {
		if (isLoading) {
			return;
		}
		isLoading = true;
		data = buildFormData($("#"+$(this).attr("href")));
		
		$("#submitStatus").removeClass("hide").html("Loading...");
		
		$.ajax({
			dataType: "json",
			url: editingEvent == null ? "/event/add" : "/event/"+eventid+"/edit",
			type: "POST",
			data: data,
			success: function(data, status, xhr) {
				isLoading = false;				
				if (data.status != 200) {
					var errs = "<ul style='list-style:none;'>";
					for (var i = 0; i < data.err.length; i++) {
						errs += "<li>"+data.err[i]+"</li>";
					}
					errs += "</ul>";
					$("#submitStatus").html("Sorry, the event could not be created due to the following errors:<br/>"+errs);
					return;
				}
				
				isLoading = true; // prevent from publishing again..
				
				$("#submitStatus").html("Success!");
				setTimeout(function() {
					$("#submitStatus").addClass("hide");
				}, 500);
				
				$("#afterSubmit").removeClass("hide");
				$("#afterPublishHide").addClass("hide");
				//$form.find("input[name=eventName]").attr('disabled', true)
				window.scrollTo(0,0);
				
				if (!eventid) {
					eventid = data.id;
				} else {
					window.location = '/event/'+eventid;
				}
				
				$("#invitationLink").attr("href", "http://eventmost.com/event/"+eventid).html("eventmost.com/event/"+eventid);
				$(".gotoeventbutton").attr("href", "/event/"+eventid);
			},
			error: function(xhr, status, error) {
				isLoading = false;
			}
		})
	});
	
	// Invitation link select all text inside it
	$("#invitationLink").click(function(ev) {
		ev.preventDefault()
		// select the text inside the div
		if (document.selection) {
			var range = document.body.createTextRange();
			range.moveToElementText(this);
			range.select();
		} else if (window.getSelection) {
			var range = document.createRange();
			range.selectNode(this);
			window.getSelection().addRange(range);
		}
		
		return false;
	})
	
	var pwdSuccess = $("#passwordProtectSuccess")
	var pwdSubmit = $("#submitPasswordProtection")
	var pwdField = $("#passwordProtection")
	
	pwdSubmit.click(function(ev) {
		ev.preventDefault();
		
		if (pwdField.val().length > 0) {
			// Update the settings
			pwdSuccess.removeClass('hide');
			pwdSubmit.addClass('hide');
			pwdField.addClass('hide')
			$(".passwordText").addClass('hide')
			
			$.ajax({
				url: "/event/"+eventid+"/edit",
				type: "POST",
				dataType: "json",
				data: {
					_csrf: $("head meta[name=_csrf]").attr('content'),
					passwordString: pwdField.val(),
					password: true
				}
			})
		} else {
			return;
		}
		
		return false;
	})
	
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
		$('#fromDateMobile, #fromDateDesktop').parent().find('input[type=time]').val(time);
		$('#fromDateMobile, #fromDateDesktop').datepicker("setDate", date);
		
		date = new Date(ev.end)
		time = ('0' + date.getHours()).slice(-2) + ":" + ('0' + date.getMinutes()).slice(-2);
		$('#toDateMobile, #toDateDesktop').parent().find('input[type=time]').val(time)
		$('#toDateMobile, #toDateDesktop').datepicker("setDate", date);
		
		// Description
		$(editor.i.contentWindow.document.body)[0].innerHTML = ev.description || ""
		$(editor1.i.contentWindow.document.body)[0].innerHTML = ev.description || ""
		
		// Categories
		$(".selectedCategoriesList span").each(function() {
			removeCategory($(this), $(this).attr("val"))
		})
		for (var i = 0; i < ev.categories.length; i++) {
			addCategory(ev.categories[i])
		}
		
		// TODO tickets
		$('.allowAttendeesToCreateTheirOwnCategories').attr('checked', ev.allowAttendeesToCreateCategories || false);
		$('.allowAttendeesToCommentOnTheEvent').attr('checked', ev.allowAttendeesToComment || false);
		if (ev.pricedTickets) {
			$('.includePricedTickets').trigger('click')
		}
		
		$scope = angular.element($("#tickets")).scope();
		$scope.tickets = ev.tickets;
		for (var i = 0; i < $scope.tickets; i++) {
			var s = new Date($scope.tickets[i].start);
			var e = new Date($scope.tickets[i].end);
			
			$scope.tickets[i].start_date = s.getDate() + "/" + (s.getMonth()+1) + "/" + s.getFullYear();
			$scope.tickets[i].start_time = s.getHours() + ":" + s.getMinutes();
			$scope.tickets[i].end_date = e.getDate() + "/" + (e.getMonth()+1) + "/" + e.getFullYear();
			$scope.tickets[i].end_time = e.getHours() + ":" + e.getMinutes();
		}
		if ($scope.tickets.length == 0) {
			$scope.tickets.push($scope.defaultTicket)
		}
		
		if (!$scope.$$phase) {
			$scope.$digest();
		}
		
		$('.eventSubmitBtn').html('Save Event')
	}
});

eventMost.controller('eventAdd', function($scope) {
	var s = $scope;
	
	s.addTicket = function () {
		$scope.tickets.push({
			price: 0.0,
			quantity: 1,
			name: "",
			whopays: 'me'
		})
	}
	
	s.removeTicket = function (index) {
		$scope.tickets.splice(index, 1)
	}
	
	s.ticket = null;
	s.defaultTicket = {
		price: 0.0,
		quantity: 1,
		name: "",
		description: "",
		hasSaleDates: false,
		start_date: "",
		start_time: "00:00",
		end_date: "",
		end_time: "00:00",
		showRemainingTickets: true,
		min_per_order: 1,
		max_per_order: '',
		discountCodes: []
	};
	s.tickets = [$scope.defaultTicket];
	
	s.showTicket = function (ticket) {
		$scope.ticket = ticket;
	}
	s.addDiscountCode = function (ticket) {
		ticket.discountCodes.push({
			code: "",
			discount: null
		})
	}
})