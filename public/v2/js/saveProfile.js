$(document).ready(function() {
	$("#profileSaveButton").click(function(ev) {
		ev.preventDefault()
		
		$("#profileSaveStatus").removeClass("hide").html("<b>Saving..</b>")
		
		var formData = {};
		$("#profileForm input").each(function() {
			formData[$(this).attr('name')] = $(this).val();
		})
		
		$.ajax({
			url: "/profile/edit",
			data: formData,
			dataType: "json",
			type: "POST",
			success: function(data, status, jqxhr) {
				$("#profileSaveStatus").html("<b>Saved!</b>")
			}
		})
		
		return false;
	});
})