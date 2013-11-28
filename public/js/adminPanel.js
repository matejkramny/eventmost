$(document).ready(function() {
	// Avatar upload
	var avatarUploadRequest;
	var file;
	$("#logo, #sponsor1, #sponsor2, #sponsor3").change(function() {
		var files = this.files;
		
		var $this = $(this)
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
			$('#'+$this.attr('for')).attr('src', img.target.result);
		}
		reader.readAsDataURL(file);
		
		uploadAvatar($this)
	})
	
	function uploadAvatar (el) {
		if (typeof file === "undefined" || file == null) {
			return;
		}
		
		var form = new FormData();
		form.append("_csrf", $("head meta[name=_csrf]").attr('content'));
		form.append(el.attr('name'), file);
		avatarUploadRequest = new XMLHttpRequest();
		avatarUploadRequest.responseType = "json";
		avatarUploadRequest.onreadystatechange = xmlhttprequestResponse(el);
		avatarUploadRequest.upload.addEventListener('progress', xmlUploadProgress(el), false)
		avatarUploadRequest.open("POST", "/event/"+$("head meta[name=event_id]").attr('content')+"/edit");
		avatarUploadRequest.setRequestHeader('Accept', 'application/json');
		avatarUploadRequest.send(form);
	}
	
	function updateProgress(perc, el) {
		if (perc > 0) {
			el.parent().find('.progress-bar').removeClass('progress-bar-success').parent().removeClass("hide")
		}
		
		el.parent().find('.progress-bar').attr("aria-valuenow", perc).css("width", perc+"%").find("span").html(perc+"% Uploaded");
		
		if (perc >= 100) {
			el.parent().find('.progress-bar').addClass("progress-bar-success").parent().addClass("hide");
		}
	}
	
	function xmlUploadProgress (el) {
		this.el = el;
		var self = this;
		return function(ev) {
			if (ev.lengthComputable) {
				var percent = Math.round(ev.loaded * 100 / ev.total);
				updateProgress(percent, self.el)
			}
		}
	}
	function xmlhttprequestResponse (el) {
		this.el = el;
		this.request = avatarUploadRequest;
		var self = this;
		
		return function() {
			if (self.request.readyState == 4) {
				if (self.request.status == 200) {
					result = self.request.response;
					
					if (result && result.status != 200) {
						alert("Could not upload image\n"+result.err);
					}
				} else {
					// Not ok
					alert(self.request.statusText);
				}
			}
		}
	}
})