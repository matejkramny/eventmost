var file;

angular.module('eventMost')
.controller('feedbackProfileController', function($scope) {
	$scope.profile = {
		name: "",
		email: "",
		position: "",
		company: "",
		website: "",
		desc: "",
		category: ""
	}
	$scope.categories = [];
	$scope.progress = 0;
	
	$scope.init = function (profile, categories) {
		$scope.profile = profile.user;
		$scope.profile._id = profile._id;
		$scope.categories = categories;		
		$('.avatar-upload-image').attr('src', $scope.profile.avatar || "/images/big-avatar-blue.svg");
	}
	
	var avatarUploadRequest;
	
	$scope.save = function () {

		var errmsg = '';
		var form = new FormData();
		
		form.append("_csrf", $("head meta[name=_csrf]").attr('content'));
		for (var name in $scope.profile) {
			if (name == "avatar") continue;
			form.append(name, $scope.profile[name]);

			if( name == 'name' && ($scope.profile[name] == '' || $scope.profile[name] == null) )
			{
				errmsg += 'Name is missing.';
			}
			if( name == 'email' && ($scope.profile[name] == '' || $scope.profile[name] == null) )
			{
				errmsg += 'Email is invalid or missing.';
			}

			if( name == 'category' && ($scope.profile[name] == '' || $scope.profile[name] == null) )
			{
				errmsg += 'Event category is missing.';
			}

			if(errmsg != "")
			{
			    $("#errmsg").removeClass('errmsg-hide');
			    $("#errmsg").addClass('errmsg-show');
				$("#errmsg").html(errmsg);
				return;
			}
		}

		form.append("avatar", file);
		avatarUploadRequest = new XMLHttpRequest();
		avatarUploadRequest.open("POST", "/event/"+$("head meta[name=event_id]").attr('content')+"/admin/feedback/edit", true);
		avatarUploadRequest.responseType = "json";
		avatarUploadRequest.setRequestHeader("accept", "application/json");
		avatarUploadRequest.onreadystatechange = xmlhttprequestResponse;
		avatarUploadRequest.upload.addEventListener('progress', $scope.uploadProgressChange, false)
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