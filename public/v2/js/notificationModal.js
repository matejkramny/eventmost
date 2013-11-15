$(document).ready(function() {
	$("#notificationModal button[type=submit]").click(function() {
		$("#notificationModal .statusText").removeClass('hide').html("Saving..")
		
		var data = {};
		$("#notificationModal input[type=radio]:checked, #notificationModal input[type=hidden]").each(function() {
			data[$(this).attr("name")] = $(this).val()
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
})