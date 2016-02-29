$(document).ready(function() {
	$("#username").on("input", function(){
		/*
		
		*** Fix HTML with Make Admin Button
		*** Create Loop with HTML piece.
		*** Filter Already Planners from search Results
		- Route for Make Admin
			- add user as attendee
			- add him admin

		*/

		var resultHTML = '';
		var eventId = $('#eventid').val();
		var img_src = "/profileavatars/540a02239643993c198d7b1d.jpeg";
		var input_val = $("#username").val();
		if(input_val != ''){
			$.ajax({
				url: "/search/users/?q="+input_val,
				beforeSend: function( xhr ) {
					$('#loading').show();
				}
			}).done(function( data ) {
				$('#loading').hide();
				data.forEach(function(this_user){
					
					var this_user_name = this_user.name+" "+this_user.surname;
					var this_user_avatar = (this_user.avatar == '' ? '/images/default_speaker-purple.svg':this_user.avatar);
					var this_user_link = '/event/'+eventId+'/admin/addUserAsAdmin/'+this_user._id;
					resultHTML = resultHTML+'<div class="pop-input center"><a href="'+this_user_link+'"><div style="width:15%; float:left"><img src="'+this_user_avatar+'" style="max-height:50px; max-width:50px"></div><div style="float:left"><span>'+this_user_name+'</span></div></a></div><div class="clearfix"></div>';
				})
				
				$('#searchresults').html(resultHTML);
				
			}).fail(function(){
				$('#loading').hide();
				console.log("fail");
				$('#searchresults').html('');
			});
		}else{
			$('#searchresults').html('');

		}
	});







	$accessEvent = $("#accessEvent")
	$createOwnCategory = $("#createOwnCategory")
	$eventCategoryList = $("#eventCategoryList")
	$accessEventWarningMessage = $(".accessEventWarningMessage")
	
	var selectedCategory = null;
	var hadWarningAboutSelectingCategory = false;
	
	function deselectAllCategories() {
		$eventCategoryList.find("input[type=button]").each(function() {
			$(this).removeClass("eventCategorySelected");
			$(this).css("border", "");
		})
	}
	
	$eventCategoryList.find("input[type=button]").click(function() {
		var cat = $(this).attr('value');
		
		if ($(this).hasClass("eventCategorySelected")) {
			$(this).removeClass("eventCategorySelected");
			$(this).css("border", "");

		} else {
			deselectAllCategories();
			$(this).addClass("eventCategorySelected");
			$(this).css("border", "#333 1px solid");
			selectedCategory = cat;
		}
	})
	
	$createOwnCategory.focus(function() {
		// Unselect all eventCategoryList inputs..
		deselectAllCategories();
	}).bind("change paste keyup", function() {
		selectedCategory = $(this).val();
	})
	
	function accessEvent (checkCategories) {
		if (checkCategories) {
			// Check if has selected any category or entered own

			// Check if there are options to create category // selct category
			var hasOption = false;
			if ($createOwnCategory.length > 0) {
				hasOption = true;
			}
			if ($eventCategoryList.find("input[type=button]").length > 0) {
				hasOption = true;
			}

			if (hasOption && (selectedCategory == null || selectedCategory.length == 0) && hadWarningAboutSelectingCategory == false) {
				$accessEventWarningMessage.removeClass("hide");
				hadWarningAboutSelectingCategory = true;
				return;
			}
		}

		// I AM ATTENDING ALRIGHT
		$accessEventWarningMessage.removeClass("hide");
		$accessEventWarningMessage.html("Adding you to the attendees list..");
		$.ajax({
			url: "/event/"+$("head meta[name=event_id]").attr('content')+"/join",
			type: "POST",
			dataType: "json",
			data: {
				//password: "blabalbla",
				category: selectedCategory,
				_csrf: $("head meta[name=_csrf]").attr('content')
			},
			success: function(data, status, xhr) {
				if (data.status != 200) {
					$accessEventWarningMessage.html("Sorry, could not attend because(data status not 200): "+data.message);
				} else {
					// basically refresh the page
					$accessEventWarningMessage.html("All done, if the page doesn't reload automagically, hit F5 or Control+r or CMD+R");
					window.location = "/event/"+$("head meta[name=event_id]").attr('content');
				}
			},
			error: function(xhr, status, err) {
				$accessEventWarningMessage.html("Sorry, could not attend because (ajax error): "+err);
			}
		})
	}
	
	$("#accessEventDirect").click(function() {
		accessEvent(false);
	})
	
	$accessEvent.click(function() {
		accessEvent(true);
	})
	
	if (window.location.hash) {
		var hash = window.location.hash.substring(1);
	
		if (hash == "openAttend") {
			if ($("#accessEventDirect").length > 0) {
				// redirect to attend event
				$("#accessEventDirect").click()
			} else {
				$("#attendModal").modal('show')
				window.location.hash = "";
			}
		}
	}
	
	var attendeeanchors  = $(".fakeattendee")
	var attendeeanchor
	var $anchorparentdiv
	var href

	$('.fakeattendee').each(function () {
	    var $this = $(this);
	    $anchorparentdiv = $this.parent().parent()
	    $anchorparentdiv.on("click", $this, function () {
	        href = $this.attr("href")
	        self.location.href=href	        
	    })

		$anchorparentdiv.mouseover( function() {
			//alert(this)
		    $(this).addClass('grey-rounded-box-hover')
		})

		$anchorparentdiv.mouseout( function() {
		    $(this).removeClass('grey-rounded-box-hover')
		})

		$anchorparentdiv.css({'cursor': 'pointer'})
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
});