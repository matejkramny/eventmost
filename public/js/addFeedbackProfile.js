var file;

angular.module('eventMost')
.controller('feedbackProfileController', function($scope) {
	$scope.profile = {
		name: "",
		position: "",
		company: "",
		website: "",
		description: ""
	}
	$scope.progress = 0;
	
	var avatarUploadRequest;
	
	$scope.save = function () {		
		var form = new FormData();
		
		form.append("_csrf", $("head meta[name=_csrf]").attr('content'));
		for (var name in $scope.profile) {
			if (name == "avatar") continue;
			form.append(name, $scope.profile[name]);
		}
		form.append("avatar", file);
		avatarUploadRequest = new XMLHttpRequest();
		avatarUploadRequest.responseType = "json";
		avatarUploadRequest.onreadystatechange = xmlhttprequestResponse;
		avatarUploadRequest.upload.addEventListener('progress', $scope.uploadProgressChange, false)
		avatarUploadRequest.open("POST", "/event/"+$("head meta[name=event_id]").attr('content')+"/admin/feedback/new");
		avatarUploadRequest.send(form);
	}
	
	function xmlhttprequestResponse () {
		if (avatarUploadRequest.readyState == 4) {
			if (avatarUploadRequest.status == 200) {
				result = avatarUploadRequest.response;
				
				if (result.status != 200) {
					alert("Could not save profile :(\n"+result.err);
				} else {
					
					window.location = "/event/"+$("head meta[name=event_id]").attr('content')+"/admin/feedback";
				}
			} else {
				// Not ok
				alert(avatarUploadRequest.statusText);
			}
		}
	}
});

$(document).ready(function() {
	$(".avatar-upload-btn").click(function(ev) {
		$("#avatar").trigger('click')
	});
	
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
			$(".avatar-upload-image").attr('src', img.target.result);
		}
		reader.readAsDataURL(file);
	})
})