$(document).ready(function() {
	var eventid = null;// used when event is created by ajax
	
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
	
	// Datepicker
	$(".datepickerWrapper .nowButton").click(function() {
		var now = new Date();
		var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2);
		$(this).parent().parent().find('input[type=time]').val(time)
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
			ext = ext[ext.length-1];
			
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
			$("#avatar_preview").attr('src', img.target.result);
		}
		reader.readAsDataURL(file);
	})
	
	$("#file_upload_wrapper").click(function() {
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
		avatarUploadRequest.responseType = "json";
		avatarUploadRequest.onreadystatechange = xmlhttprequestResponse;
		avatarUploadRequest.open("POST", "/event/add/avatar");
		avatarUploadRequest.send(form);
	});
	
	$("#file_delete_wrapper").click(function() {
		file = null;
		avatarUploadRequest = null;
		
		$("#avatar_preview").attr('src', '/img/default_logo.svg');
		
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
	
	function xmlhttprequestResponse () {
		if (avatarUploadRequest.readyState == 4) {
			if (avatarUploadRequest.status == 200) {
				result = JSON.parse(avatarUploadRequest.response);
				console.log(result);
				console.log(typeof result);
				if (result.status != 200) {
					alert("Could not upload image\n"+result.err);
				} else {
					// store the avatar id in the form.
					$("#file_browse").removeAttr("name");
					$("#avatar_id").attr('value', result.id);
					$("#avatarStatus").html("<br/>Uploaded");
				}
			} else {
				// Not ok
				alert(avatarUploadRequest.statusText);
			}
		}
	}
	
	// Categories & tickets
	$("#selectedCategoriesList").on('mouseover', 'li', function() {
		$(this).find("a").css("opacity", 1)
	}).on('mouseout', 'li', function() {
		$(this).find("a").css("opacity", 0)
	}).on('click', 'li a', function(e) {
		e.preventDefault()
		var cat = $(this).parent();
		var text = cat.find('.guest').html();
		removeCategory(cat, text);
		removeTicket(text)
		
		return false;
	})
	$("#selectedCategoriesList li").each(function() {
		$(this).find("a").css("opacity", 0)
	})
	
	var categories = [];
	var $tickets = $("#tickets");
	function getTickets () {
		var tickets = [];
		$tickets.find("tr").each(function() {
			$this = $(this);
			if ($this.attr("id") == "ticketTemplate") return;
			
			var ticket = {
				$t: $this
			};
			
			ticket.name = $this.find(".tickets-ticket-type").val();
			ticket.price = $this.find(".tickets-ticket-price").val();
			ticket.number = $this.find(".tickets-ticket-number").val();
			ticket.fee = $this.find(".tickets-ticket-fee").val();
			ticket.vat = $this.find(".tickets-ticket-vat").val();
			ticket.total = $this.find(".tickets-ticket-total").val();
			ticket.summary = $this.find(".tickets-ticket-summary").val();
			ticket.organiserPays = $this.find(".dropdown3 a").html() == "Me";
			tickets.push(ticket);
		});
		return tickets;
	}
	function getTicket (ticket) {
		var tickets = getTickets();
		for (var i = 0; i < tickets.length; i++) {
			var t = tickets[i];
			if (t.name == ticket) {
				// gotcha
				return t;
			}
		}
		return null;
	}
	function addTicket (ticket) {
		var t = getTicket(ticket);
		if (t != null) {
			return;
		}
		
		// copy the template
		$("#ticketTemplate").find(".tickets-ticket-type").attr("value", ticket)
		var html = "<tr>" + $("#ticketTemplate").html() + "</tr>";
		$tickets.append(html);
		
		fixTickets();
	}
	
	function removeTicket(ticket) {
		var t = getTicket(ticket);
		if (t != null) {
			t.$t.remove();
		}
	}
	
	function addCategory (category) {
		for (var i = 0; i < categories.length; i++) {
			var cat = categories[i];
			if (cat == category) {
				// Duplicate. We don't want two same categories do we.
				return;
			}
		}
		
		var template = $("#selectedCategoryListTemplate");
		template.find(".guest").html(category);
		template.find("input[type=hidden]").val(category);
		var html = template.html();
		$("#selectedCategoriesList").append(html);
		
		categories.push(category);
		
		if (categories.length > 0) {
			$("#selectedCategories .noneSelected").hide();
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
			$("#selectedCategories .noneSelected").show();
		}
	}
	
	$("#predefinedCategories li a").click(function() {
		var text = $(this).html();
		addCategory(text);
		addTicket(text);
	})
	$("#createCategory .addCategory").click(function(ev) {
		ev.preventDefault();
		
		var field = $(this).parent().find("input");
		var val = field.val();
		if (val.length > 0) {
			addCategory(val);
			addTicket(val);
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
	function buildFormData() {
		var allowCreateCategories = false;
		if ($("#cbox7").is(':checked')) {
			allowCreateCategories = true;
		}
		var pricedTickets = false;
		if ($("#cbox9").is(':checked')) {
			pricedTIckets = true;
		}
		var tickets = getTickets();
		for (var i = 0; i < tickets.length; i++) {
			delete tickets[i].$t
		}
		
		var d = {
			_csrf: $("head meta[name=_csrf]").attr('content'),
			name: getValue("#eventName"),
			avatar: getValue("#avatar_id"),
			venue_name: getValue("#venueName"),
			location: getValue("#event_location"),
			lat: getValue("#lat"),
			lng: getValue("#lng"),
			start: getTime("#datepicker"),
			end: getTime("#datepicker2"),
			description: $(editor.i.contentWindow.document.body)[0].innerHTML,
			categories: categories,
			allowAttendeesToCreateCategories: allowCreateCategories,
			pricedTickets: pricedTickets,
			tickets: pricedTickets ? tickets : [],
		};
		
		return d;
	}
	
	var isLoading = false;
	$("#publishButton").click(function() {
		if (isLoading) {
			return;
		}
		isLoading = true;
		data = buildFormData();
		
		$("#submitStatus").removeClass("hide").html("Loading...");
		
		$.ajax({
			dataType: "json",
			url: "/event/add",
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
				$("#eventName").attr('disabled', true)
				window.scrollTo(0,0);
				
				eventid = data.id;
				$("#invitationLink").html("http://eventmost.com/event/"+eventid);
			},
			error: function(xhr, status, error) {
				isLoading = false;
			}
		})
	});
	
	// Invitation link select all text inside it
	$("#invitationLink").click(function() {
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
	})
	
	var restrictive = null; // 0,1,2,3,4 = possible values
	var restrictions = [
		$("#restrictions_none"), //0
		$("#restrictions_in_range"),//1
		$("#restrictions_password"),//2
		$("#restrictions_in_range_password"),//3
		$("#restrictions_private")//4
	];
	var $eventPassword = $("#eventPassword")
	var $confirmPassword = $("#confirmPassword")
	var $finalSuccess = $("#finalSuccess")
	
	function hidePassword() {
		$("#passwordFieldWrapper").addClass("hide")
	}
	function showPassword() {
		$("#passwordFieldWrapper").removeClass("hide")
	}
	function showSuccess() {
		$finalSuccess.removeClass("hide")
		
		$finalSuccess.find(".fillWithEventLink").attr("href", "/event/"+eventid)
		$finalSuccess.find(".fillWithDropboxLink").attr("href", "/event/"+eventid+"/dropbox")
		$finalSuccess.find(".fillWithSettingsLink").attr("href", "/event/"+eventid+"/settings")
	}
	function hideSuccess() {
		$finalSuccess.addClass("hide")
	}
	
	function deselectRestriction() {
		if (restrictive == null) return;
		restrictions[restrictive].removeClass("selected");
	}
	
	function selectRestriction() {
		if (restrictive == null) return;
		restrictions[restrictive].addClass("selected")
	}
	
	function updateRestrictions() {
		if (restrictive == null) return;
		
		if (restrictive >= 2 && restrictive < 4) {
			// Show password field
			showPassword()
			hideSuccess()
		} else {
			// hide pwd field
			hidePassword()
			// show success
			showSuccess()
			// update the restriction level
			publishRestrictionSettings()
		}
	}
	
	function publishRestrictionSettings() {
		$("#successStatus").removeClass("hide").html("Updating event settings..")
		
		$.ajax({
			url: "/event/"+eventid+"/edit",
			type: "POST",
			dataType: "json",
			data: {
				_csrf: $("head meta[name=_csrf]").attr('content'),
				password: $("#eventPassword").val(),
				restriction: restrictive
			},
			success: function(data, status, xhr) {
				$("#successStatus").addClass("hide")
			},
			error: function(xhr, status, error) {
				
			}
		})
	}
	
	$confirmPassword.click(function() {
		if ($eventPassword.val().length > 0) {
			// ok, show success
			showSuccess()
			
			publishRestrictionSettings()
		} else {
			hideSuccess()
			// not ok, display some message
		}
	});
	
	// Restriction box
	for (var i = 0; i < restrictions.length; i++) {
		(function(number) {
			restrictions[number].click(function() {
				deselectRestriction();
				restrictive = number;
				selectRestriction();
				updateRestrictions();
			});
		})(i);
	}
});