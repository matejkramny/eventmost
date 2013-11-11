$(document).ready(function() {
	$("#privacyModal button[type=submit]").click(function() {
		$("#privacyModal .statusText").removeClass('hide').html("Saving..")
		
		var data = {};
		$("#privacyModal input[type=radio]:checked, #privacyModal input[type=hidden]").each(function() {
			data[$(this).attr("name")] = $(this).val()
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
})