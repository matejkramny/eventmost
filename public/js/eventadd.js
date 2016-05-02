$(document).ready(function() {
	var eventid = null;// used when event is created by ajax
	var lat, lng;
	var allowlogopreview = false;
	var allowcoverpreview = false;
	
	var isLocalStorageCapable = false;
	try {
		if ('localStorage' in window && window['localStorage'] !== null) {
			isLocalStorageCapable = true;
		}
	} catch (e) {
	}

	$('#toTime').timepicker({
		minuteStep: 5,
		timeFormat: 'hh:mm p'
	});

	$('#fromTime').timepicker({
		minuteStep: 5,
		timeFormat: 'hh:mm p'
	});

	$('.timepicker-default').click(function() {
		$(".bootstrap-timepicker-widget").css("background-color", "#fff");
	})
	//$(".bootstrap-timepicker-widget").css("background-color", "#fff");
	
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
		
		var date = new Date();
		var h =  date.getHours(), m = date.getMinutes();
		m = (m == 0)? '00' : m;
	    var _time = (h > 12) ? (h-12 + ':' + m +' PM') : (h + ':' + m +' AM');
		$(this).parent().parent().parent().find('input[type=text]').val(_time)
		
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
	
	// Avatar upload //baburw
	var avatarUploadRequest;
	var avatar_id;
	var backgroundImage_id;
	var file;
	var file2;
	var background_image;
	$("input#file_browse1").change(function() {
		var files = this.files;
		background_image = false;
		console.log('was');
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
		//uploadAvatar1();
	})
	/*
	$("#file_browse_wrapper1").click(function(ev) {
		ev.preventDefault();
		$("input#file_browse1").trigger('click');
		return false;
	})*/

	$("input#file_browse2").change(function() {
		var files = this.files;
		background_image = true;
		for (var i = 0; i < files.length; i++) {
			file2 = files[i];
			break;
		}
		
		if (typeof file2 === "undefined" || file2 == null) {
			return;
		}
		
		var ext = file2.name.split('.');
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
		reader.readAsDataURL(file2);
	})
	/*
	$("#file_browse_wrapper2").click(function(ev) {
		ev.preventDefault();
		$("input#file_browse2").trigger('click');
		return false;
	})

	*/
	var avatar_coords = null;
	window.setCoordinates = function(c) {
		avatar_coords = c;
	};

	function updatepreview(){
		if(allowlogopreview == true && allowcoverpreview == true){
			$('#previewphotos').removeClass('hide');
		}else{
			$('#previewphotos').addClass('hide');
		}
	}

	function uploadAvatar () {
		if (typeof file === "undefined" || file == null) {
			// opens the dialog
			//$("input#file_browse1").trigger('click');
			return;
		}
	
		$("#info-m").html("Uploading..");
		
		var form = new FormData();
		form.append("_csrf", $("head meta[name=_csrf]").attr('content'));
		form.append("avatar", file);
		form.append("background_image", background_image);
		/*form.append("x", avatar_coords.x);
		form.append("y", avatar_coords.y);
		form.append("w", avatar_coords.w);
		form.append("h", avatar_coords.h);*/

		form.append("x", $("#x").val());
		form.append("y", $("#y").val());
		form.append("w", $("#w").val());
		form.append("h", $("#h").val());

		avatarUploadRequest = new XMLHttpRequest();
		avatarUploadRequest.open("POST", "/event/add/avatar", true);
		avatarUploadRequest.responseType = "json";
		avatarUploadRequest.setRequestHeader("accept", "application/json");
		avatarUploadRequest.onreadystatechange = xmlhttprequestResponse;
		avatarUploadRequest.upload.addEventListener('progress', xmlUploadProgress, false)
		avatarUploadRequest.send(form);

		

		
	}
	$("#file_upload_wrapper1").click(uploadAvatar);

	
	function uploadAvatar2 () {
		if (typeof file2 === "undefined" || file2 == null) {
			// opens the dialog
			//$("input#file_browse2").trigger('click');
			return;
		}
	
		$("#info-m2").html("Uploading..");
		
		var form = new FormData();
		form.append("_csrf", $("head meta[name=_csrf]").attr('content'));
		form.append("avatar", file2);
		form.append("background_image", background_image);

		form.append("x", $("#x12").val());
		form.append("y", $("#y12").val());
		form.append("w", $("#w2").val());
		form.append("h", $("#h2").val());
		
		avatarUploadRequest = new XMLHttpRequest();
		avatarUploadRequest.open("POST", "/event/add/avatar", true);
		avatarUploadRequest.responseType = "json";
		avatarUploadRequest.setRequestHeader("accept", "application/json");
		avatarUploadRequest.onreadystatechange = xmlhttprequestResponse2;
		avatarUploadRequest.upload.addEventListener('progress', xmlUploadProgress2, false)
		avatarUploadRequest.send(form);

		

	}
	$("#file_upload_wrapper2").click(uploadAvatar2);
	
	$(".file_delete_wrapper").click(function() {
		
		file = null;
		avatarUploadRequest = null;
		

		//$("#thumb").attr('src', '/images/upload.png');
		$('#profile_pic').hide();
		$('#profile_pic_default').hide();
		$("#thumb").attr('style', '');
		$("#file_browse1").attr("value", "");
		$("#info-m").html("Logo has been removed");
		if(jcrop_api){
			jcrop_api.destroy();
		}
		$("#image_div").hide();
		console.log('delete avatar from eventadd.js');
		if(ev.avatar && ev.avatar.url == '/images/event-avatar-new.svg'){
			//No need to delete anything... Because it is the default logo
		}else{
			$.ajax({
				url: "/event/"+avatar_id+"/avatar/remove",
				type: "GET"
			}).done(function(res){
				avatar_id = "";
			})
		}
		
		

		allowlogopreview = false;
		updatepreview();
	});

	$(".file_delete_wrapper2").click(function() {
		
		file = null;
		avatarUploadRequest = null;
		
		$("#thumb2").attr('src', '/images/logo-avatar.svg');
		$("#thumb2").attr('style', '');
		$("#file_browse2").attr("value", "");
		$("#info-m2").html("Cover has been removed");
		//jcrop_api2.destroy();
		if(jcrop_api2){
			jcrop_api2.destroy();
		}
		$("#image_div2").hide();
		if(ev.backgroundImage){

			$.ajax({
				url: "/event/"+ev.backgroundImage._id+"/avatar/remove",
				type: "GET"
			}).done(function(res){
				backgroundImage_id = "";
			})

		}else{
			$.ajax({
				url: "/event/"+backgroundImage_id+"/avatar/remove",
				type: "GET"
			}).done(function(res){
				backgroundImage_id = "";
			})
		}
		
		allowcoverpreview = false;
		updatepreview();
	});

	function useFull(){
    
	    $('#profile_pic').hide();
	    var source = $('#load_img').attr("src");

	    $('#thumbParent').css({
	        width: '21%'
	    })
	    $('#thumb_default').attr("src", source);
	    $('#thumb_default').css({
	        'max-width': '100%',
	        'max-height': '100%'
	    });
	    $('#profile_pic_default').show();
	    $('#profile_pic_default').css({
	        'display': 'table-cell'
	    });

	    //jcrop_api.destroy();
	    $("#image_div").hide();
	    uploadAvatar();
	    //alert('hi');
	}

	$("#usedefault").click(function (){

		$('#profile_pic').hide();
	    var source = $('#load_img').attr("src");

	    $('#thumbParent').css({
	        width: '21%'
	    })
	    $('#thumb_default').attr("src", source);
	    $('#thumb_default').css({
	        'max-width': '100%',
	        'max-height': '100%'
	    });
	    $('#profile_pic_default').show();
	    $('#profile_pic_default').css({
	        'display': 'table-cell'
	    });

		$("#image_div").hide();
		uploadAvatar();
		
	});

	$("#cropButton1").click(function (){

		var c_w = $('#w').val();
    	var c_h = $('#h').val();
		//alert(c_w+" "+c_h);
		

		/*if(c_w < 300 || c_h < 200){
			alert("Sorry! You can not crop with this dimension.");
		}else{
			$("#image_div").hide();
			uploadAvatar();
		}*/

		$("#image_div").hide();
		uploadAvatar();
		
	});

	$("#cropButton2").click(function (){
		var c_w = $('#w2').val();
    	var c_h = $('#h2').val();
		//alert(c_w+" "+c_h);
		

		if(c_w < 500 || c_h < 150){
			alert("Sorry! You can not crop with this dimension.");
		}else{
			$("#image_div2").hide();
			uploadAvatar2();
		}
	});
	
	function updateProgress(perc) {
		if (perc > 0) {
			$("#logoprogressbar").removeClass('progress-bar-success').parent().removeClass("hide")
		}
		
		$("#logoprogressbar").attr("aria-valuenow", perc).css("width", perc+"%").find("span").html(perc+"% Uploaded");
		
		if (perc >= 100) {
			$("#logoprogressbar").addClass("progress-bar-success").parent().addClass("hide");
		}
	}
	
	function xmlUploadProgress (ev) {
		if (ev.lengthComputable) {
			var percent = Math.round(ev.loaded * 100 / ev.total);
			updateProgress(percent)
		}
	}

	function updateProgress2(perc) {
		if (perc > 0) {
			$("#coverprogressbar").removeClass('progress-bar-success').parent().removeClass("hide")
		}
		
		$("#coverprogressbar").attr("aria-valuenow", perc).css("width", perc+"%").find("span").html(perc+"% Uploaded");
		
		if (perc >= 100) {
			$("#coverprogressbar").addClass("progress-bar-success").parent().addClass("hide");
		}
	}
	
	function xmlUploadProgress2 (ev) {
		if (ev.lengthComputable) {
			var percent = Math.round(ev.loaded * 100 / ev.total);
			updateProgress2(percent)
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
					$("#info-m").html("Logo Added!");
					console.log("avatar_id:"+ avatar_id);
					$.ajax({
						url: "/eventavatar/"+avatar_id,
						success: function(data, status, xhr) {
							//console.log(data.avatar);
							$('#logopreview').attr("src", data.avatar);
							allowlogopreview = true;
							updatepreview();
						}			
					});
				}
			} else {
				// Not ok
				if(avatarUploadRequest.statusText != ''){
					alert(avatarUploadRequest.statusText);
				}
			}
		}
	}

	function xmlhttprequestResponse2 () {
	  if (avatarUploadRequest.readyState == 4) {
	   if (avatarUploadRequest.status == 200) {
	    result = avatarUploadRequest.response;
	    console.log(result);
	    console.log(typeof result);
	    if (result.status != 200) {
	     alert("Could not upload image\n"+result.err);
	    } else {
	     // store the avatar id in the form.
	     backgroundImage_id = result.id;
	     $("#info-m2").html("Background Photo has been cropped. :)");
	     console.log("backgroundImage_id:"+ backgroundImage_id);
	     $.ajax({
						url: "/eventavatar/"+backgroundImage_id,
						success: function(data, status, xhr) {
							//console.log(data.avatar);
							$('#coverpreview').attr("src", data.avatar);
							allowcoverpreview = true;
							updatepreview();
						}			
					});
	    }
	   } else {
	    // Not ok
	    alert(avatarUploadRequest.statusText);
	   }
	  }
	 }


	
	// Categories & tickets
	$(".selectedCategoriesList").on('click', 'a.remove-category', function(e) {
		e.preventDefault()
		
		var text = $(this).attr("val");
		removeCategory($(this), text);
		
		return false;
	})
	
	var categories = [];
	var $ticketsWrapper = $(".ticketsWrapper")
	var $tickets = $("#tickets");
	var $ticketsLock = $(".tickets-lock");
	
	$ticketsLock.addClass('hide')
	setTimeout(function() {
		if ($("#dontincludepricedtickets").is(":checked")) {
			$ticketsLock.removeClass('hide')
		}
	}, 200)
	
	//Yes,No hiding/showing the #ticketsWrapper
	$("#includepricedtickets").change(function() {
		if ($(this).is(":checked")) {
			$("#dontincludepricedtickets").attr("checked", false)
			$ticketsLock.addClass("hide");
		} else {
			$("#dontincludepricedtickets").attr("checked", "checked")
			$ticketsLock.removeClass("hide");
		}
	})
	$("#dontincludepricedtickets").change(function() {
		if ($(this).is(":checked")) {
			$("#includepricedtickets").attr("checked", false)
			$ticketsLock.removeClass("hide");
		} else {
			$("#includepricedtickets").attr("checked", "checked")
			$ticketsLock.addClass("hide");
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
		var template = "";
		template += "<div><div class='col-lg-9 col-md-9 col-xs-9' style='padding-left:0px;'>\
							<input value='"+category+"' disabled='disabled' class='input-ashen-rounded font-exception-thin' type='text' style='height:35px;background-color:#D5D6D7;'>\
						</div>\
						<div class='col-lg-3 col-md-3 col-xs-3 pad-left-zero'>\
							<a href class='remove-category' style='color:#0992A3;' val='"+category+"'>\
								Delete\
							</a>\
						</div>\
						<div class='clearfix'></div><div class='nspacer-small'></div></div>";
		
		$(".selectedCategoriesList").append(template);
		
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
		
		$category.parent().parent().remove();
		
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
	
	$('.privateEvent').on('click', function() {
		if ($('.privateEvent').is(':checked')) {
			$('.privateEventMessage').removeClass('hide')
		} else {
			$('.privateEventMessage').addClass('hide')
		}
	})
	
	function getValue(selector) {
		return $(selector).val();
	}

	function convertTime(time) {

		/*
			- get time from input.
			- call getTime which return date with time.
			- get time will call convertTime.
				- Convert Time to 24 Hours
		*/
	    var hours = Number(time.match(/^(\d\d?)/)[1]);
	    var minutes = Number(time.match(/:(\d\d?)/)[1]);
	    var AMPM = time.match(/\s(.AM|PM)$/i)[1];

	    if ((AMPM == 'PM' || AMPM == 'pm') && hours<12) 
	    {
	        hours = hours+12;
	    }
	    else if ((AMPM == 'AM' || AMPM == "am") && hours==12)
	    {
	        hours = hours-12;
	    }

	    var sHours = hours.toString();
	    var sMinutes = minutes.toString();

	    if(hours<10)
	    {
	        sHours = "0" + sHours;
	    }
	    else if(minutes<10) {
	        sMinutes = "0" + sMinutes;
	    }

	    return sHours + ":" + sMinutes; 

	}
	
	function getTime (datepicker) {
		var dpicker = $(datepicker);
		var time = dpicker.parent().find("input[type=text]").val();
		console.log(time);
		time = convertTime(time);
		console.log(time);
		//var dTime = dpicker.parent().find("select").val();
		//console.log(dTime);
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
		var pricedTickets = false;
		if ($form.find(".includePricedTickets").is(':checked')) {
			pricedTickets = true;
		}
		var privateEvent = false;
		if ($form.find(".privateEvent").is(':checked')) {
			privateEvent = true;
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
			backgroundImage: backgroundImage_id,
			venue_name: $form.find('input[name=venueName]').val(),
			location: $form.find('input[name=address]').val(),
			lat: lat,
			lng: lng,
			start: getTime($form.find('.datepicker')[0]),
			end: getTime($form.find('.datepicker')[1]),
			description: $(ed.i.contentWindow.document.body)[0].innerHTML,
			categories: categories,
			allowAttendeesToCreateCategories: allowCreateCategories,
			pricedTickets: pricedTickets,
			privateEvent: privateEvent,
			tickets: pricedTickets ? tickets : [],
		};
		console.log(d);
		
		return d;
	}
	
	var isLoading = false;
	$(".eventSubmitBtn").click(submitThisEvent);

	function submitThisEvent() {
		//uploadAvatar();
		//uploadAvatar2();

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
			success: function(res, status, xhr) {
				isLoading = false;				
				if (res.status != 200) {
					if(res.message){
						var errs = "<ul style='list-style:none;'>";
						for (var i = 0; i < res.message.length; i++) {
							errs += "<li>"+res.message[i]+"</li>";
						}
						errs += "</ul>";
					}else if(res.err){
						var errs = "<ul style='list-style:none;'>";
						for (var i = 0; i < res.err.length; i++) {
							errs += "<li>"+res.err[i]+"</li>";
						}
						errs += "</ul>";
					}else{
						var errs = '';
					}
					
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
					eventid = res.id;
				} else {
					//window.location = '/event/'+eventid;
				}
				
				$("#invitationLink").html("<input size='' id='event_id_field' style='width:100%' value='" +"eventmost.com/event/"+eventid+"'></input>");
				$(".gotoeventbutton").attr("href", "/event/"+eventid);
			},
			error: function(xhr, status, error) {
				isLoading = false;
			}
		})
	}
	
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

			/*
				1. Extra div, show on edit and hide on browse click.
				2. profile_pic, remove img_thumb

			*/
			avatar_id = ev.avatar._id;
			//$(".avatar_preview").attr('src', ev.avatar.url);
			$("#profile_pic").show();
			$("#profile_pic").css({
				"vertical-align": "middle",
				"text-align": "center",
				"background": "#fff",
				"max-width": "200px",
				"display": "flex"
			});
			$("#thumb").attr('src', ev.avatar.url);
			$("#thumb").addClass('img-thumbnail');
			$("#logopreview").attr('src', ev.avatar.url);
			allowlogopreview = true;

			
			if(ev.backgroundImage && ev.backgroundImage.backgroundFlag == true){
				/*
				- Show cover if available
					- mark checkbox ***
					- show preview ***
					- Update event on delete avatar ***
				*/
				//console.log(ev.backgroundImage._id);
				backgroundimage_id = ev.backgroundImage._id;

				allowcoverpreview = true;
				console.log("show preview");
				allowlogopreview = true;
				allowcoverpreview = true;
				$("#previewphotos").removeClass('hide');
				$("#logopreview").attr('src', ev.avatar.url);
				$("#coverpreview").attr('src', ev.backgroundImage.url);
				$('#creditcardsmaller23').attr('ng-init', 'background=true');
				$('#desktop').find('[ng-show="background"]').show();

			}
			console.log(ev);
		}
		
		// name
		$('form input[name=eventName]').val(ev.name)
		// venue name
		$('form input[name=venueName]').val(ev.venue_name)
		
		// Dates
		var date = new Date(ev.start);
		var h =  date.getHours(), m = date.getMinutes();
		m = (m == 0)? '00' : m;
	    var _time = (h > 12) ? (h-12 + ':' + m +' PM') : (h + ':' + m +' AM');

		//var time = ('0' + date.getHours()).slice(-2) + ":" + ('0' + date.getMinutes()).slice(-2);
		$('#fromDateMobile, #fromDateDesktop').parent().find('input[type=text]').val(_time);
		$('#fromDateDesktop').datepicker();
		$('#fromDateDesktop').datepicker("setDate", date);
		
		date = new Date(ev.end);
		var h =  date.getHours(), m = date.getMinutes();
		m = (m == 0)? '00' : m;
	    var _time = (h > 12) ? (h-12 + ':' + m +' PM') : (h + ':' + m +' AM');
		
		//time = ('0' + date.getHours()).slice(-2) + ":" + ('0' + date.getMinutes()).slice(-2);
		$('#toDateMobile, #toDateDesktop').parent().find('input[type=text]').val(_time)
		$('#toDateDesktop').datepicker();
		$('#toDateDesktop').datepicker("setDate", date);
		//-----------------------------------
		

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
		addCategory("Guest Speaker");
		
		/*$('#fromDateMobile, #fromDateDesktop').parent().find('input[type=text]').val('00:00');
		$('#toDateMobile, #toDateDesktop').parent().find('input[type=text]').val('23:59');*/
	}
 
 	var cnt = 0;
	$("#copy_event_id").mouseover(function () { //bind zclip to the button on click
		if(cnt==1)
			return;
		cnt = 1;
		$("#event_id_field").select();
		$("#copy_event_id").zclip({
			path:"/js/ZeroClipboard.swf",
			copy:function(){return $("input#event_id_field").val()},
	        afterCopy: function() {
	        	var hold = 1
	        	//console.log("copied");
	        	$('#successCopy').show();
	        	$('#successCopy').delay(3000).fadeOut();
	        }
		})
	});
	//$("#copy_event_id").click(function(){
		
	//	var linktext = document.getElementById('event_id_field').value;


		/*var holdtext = $("#event_id_field").val();
		alert(holdtext);
		Copied = holdtext.createTextRange();
		Copied.execCommand("Copy");
		alert("done");*/

		//----------------

		/*var text = $("#invitationLink").val();
		if(window.copy(text)){

			alert("done");
		}else{
			alert("nop!");
		}*/
	//})

	//$("#event_id_field").focus(function() { this.select(); });
});

eventMost.controller('eventAdd', function($scope) {
	var s = $scope;
	
	s.addTicket = function () {
		$scope.tickets.push({
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
			min_per_order: 0,
			max_per_order: '',
			discountCodes: []
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
		min_per_order: 0,
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
