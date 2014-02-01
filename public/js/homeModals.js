$(document).ready(function() {
	$("#privacyModal button[type=submit]").click(function() {
		$("#privacyModal .statusText").removeClass('hide').html("Saving..")
		
		var data = {};
		$("#privacyModal input[type=checkbox], #privacyModal input[type=hidden]").each(function() {
			if ($(this).attr("type") == 'checkbox' && !$(this).is(':checked')) {
				data[$(this).attr("name")] = 'no';
			} else {
				data[$(this).attr("name")] = $(this).val()
			}
		})
		
		$.ajax({
			data: data,
			url: '/profile/edit',
			dataType: "json",
			type: "POST",
			success: function (data) {
				if (data.status != 200) {
					$("#privacyModal .statusText").html("Could not save profile :(\n"+data.err);
				} else {
					$("#privacyModal .statusText").addClass('hide').html("Saved!");
					$("#privacyModal").modal('hide')
				}
			}
		})
	})
	
	$("#notificationModal button[type=submit]").click(function() {
		$("#notificationModal .statusText").removeClass('hide').html("Saving..")
		
		var data = {};
		$("#notificationModal input[type=checkbox], #notificationModal input[type=hidden]").each(function() {
			if ($(this).attr("type") == 'checkbox' && !$(this).is(':checked')) {
				data[$(this).attr("name")] = 'no';
			} else {
				data[$(this).attr("name")] = $(this).val()
			}
		})
		
		$.ajax({
			data: data,
			url: '/profile/edit',
			dataType: "json",
			type: "POST",
			success: function (data) {
				if (data.status != 200) {
					$("#notificationModal .statusText").html("Could not save profile :(\n"+data.err);
				} else {
					$("#notificationModal .statusText").addClass('hide').html("Saved!");
					$("#notificationModal").modal('hide')
				}
			}
		})
	})
	
	$("#loginSettingsModal button[type=submit]").click(function(ev) {
		ev.preventDefault();
		
		$("#loginSettingsModal .statusText").removeClass('hide').html("Saving..")
		
		var data = {};
		$("#loginSettingsModal input[type=email], #loginSettingsModal input[type=hidden], #loginSettingsModal input[type=password]").each(function() {
			data[$(this).attr("name")] = $(this).val()
		})
		
		$.ajax({
			data: data,
			url: '/profile/edit',
			dataType: "json",
			type: "POST",
			success: function (data) {
				if (data.status != 200) {
					$("#loginSettingsModal .statusText").html("Could not save your profile..<br/>\n"+data.err);
				} else {
					$("#loginSettingsModal .statusText").html("Saved!");
				}
			}
		})
		
		return false;
	})
})