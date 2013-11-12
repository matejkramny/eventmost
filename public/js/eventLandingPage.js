$(document).ready(function() {
	$accessEvent = $("#accessEvent")
	$createOwnCategory = $("#createOwnCategory")
	$eventCategoryList = $("#eventCategoryList")
	$accessEventWarningMessage = $(".accessEventWarningMessage")
	
	var selectedCategory = null;
	var hadWarningAboutSelectingCategory = false;
	
	function deselectAllCategories() {
		$eventCategoryList.find("input[type=button]").each(function() {
			$(this).removeClass("eventCategorySelected");
		})
	}
	
	$eventCategoryList.find("input[type=button]").click(function() {
		var cat = $(this).attr('value');
		
		if ($(this).hasClass("eventCategorySelected")) {
			$(this).removeClass("eventCategorySelected");
		} else {
			deselectAllCategories();
			$(this).addClass("eventCategorySelected");
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
					$accessEventWarningMessage.html("Sorry, could not attend because: "+data.message);
				} else {
					// basically refresh the page
					$accessEventWarningMessage.html("All done, if the page doesn't reload automagically, hit F5 or Control+r or CMD+R");
					window.location.reload();
				}
			},
			error: function(xhr, status, err) {
				$accessEventWarningMessage.html("Sorry, could not attend because: "+err);
			}
		})
	}
	
	$("#accessEventDirect").click(function() {
		accessEvent(false);
	})
	
	$accessEvent.click(function() {
		accessEvent(true);
	})
});