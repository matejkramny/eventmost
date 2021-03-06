$(document).ready(function() {
	$(".avatar-upload-btn").click(function(ev) {
		$("#avatar").trigger('click')
	});
	
	var avatarUploadRequest;
	var file;
	
	var parseJson = false;
	
	$("#profileSaveButton").click(function(ev) {
		ev.preventDefault()
		
		$("#profileSaveStatus").removeClass("hide").html("<b>Saving..</b>")
		
		var formData = {};
		$("#profileForm input").each(function() {
			formData[$(this).attr('name')] = $(this).val();
		})

		$("#profileForm textarea").each(function() {
			formData[$(this).attr('name')] = $(this).val();
		})
		
		var form = new FormData();
		//form.append("_csrf", $("head meta[name=_csrf]").attr('content'));
		for (var name in formData) {
			if (name == "avatar") continue;
			form.append(name, formData[name]);
		}
		
		form.append("avatar", file);
		avatarUploadRequest = new XMLHttpRequest();
		avatarUploadRequest.open("POST", "/profile/edit", true);
		try {
			avatarUploadRequest.responseType = "json";
		} catch (e) {
			parseJson = true;
		}
		avatarUploadRequest.setRequestHeader("accept", "application/json");
		avatarUploadRequest.onreadystatechange = xmlhttprequestResponse;
		avatarUploadRequest.send(form);
		
		return false;
	});
	
	function xmlhttprequestResponse () {
		if (avatarUploadRequest.readyState == 4) {
			if (avatarUploadRequest.status == 200) {
				result = avatarUploadRequest.response;
				
				if (parseJson) {
					result = JSON.parse(avatarUploadRequest.responseText);
				}
				
				if (result.status != 200) {
					$("#profileSaveStatus").html("Could not save profile :(<br/>"+result.err.join('<br/>'));
				} else {
					$("#profileSaveStatus").html("<b>Saved!</b>")
				}
			} else {
				// Not ok
				alert(avatarUploadRequest.statusText);
			}
		}
	}
	
	$("#avatar").change(function() {
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
			$(".avatar-upload-image").attr('src', img.target.result);
		}
		reader.readAsDataURL(file);
	})
})