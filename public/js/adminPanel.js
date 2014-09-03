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
			$('#'+$this.attr('for')).removeClass('element-hide');
		}

		//alert(file);
		reader.readAsDataURL(file);
		
		uploadAvatar($this);
	})

	toggleImgDisplay();

	function alertObject(obj){
		var acc = []
		$.each(obj, function(index, value) {
		    acc.push(index + ': ' + value);
		});
		//alert(JSON.stringify(acc));
	}

	function toggleImgDisplay()
	{
		//alert($('#sponsor1Avatar').attr('src'));
		if( $('#sponsor1Avatar').attr('src')=='' )
			$('#sponsor1Avatar').addClass('element-hide');

		//alert($('#sponsor2Avatar').attr('src'));
		if( $('#sponsor2Avatar').attr('src')=='' )
			$('#sponsor2Avatar').addClass('element-hide');

		//alert($('#sponsor3Avatar').attr('src'));
		if( $('#sponsor3Avatar').attr('src')=='' )
			$('#sponsor3Avatar').addClass('element-hide');
	}
	
	function uploadAvatar (el) {
		if (typeof file === "undefined" || file == null) {
			return;
		}

		//alert(el);
		//console.log(el);
		
		var form = new FormData();
		form.append("_csrf", $("head meta[name=_csrf]").attr('content'));
		form.append(el.attr('name'), file);
		avatarUploadRequest = new XMLHttpRequest();
		avatarUploadRequest.open("POST", "/event/"+$("head meta[name=event_id]").attr('content')+"/edit", true);
		avatarUploadRequest.responseType = "json";
		avatarUploadRequest.setRequestHeader("accept", "application/json");
		
		avatarUploadRequest.onreadystatechange = xmlhttprequestResponse(el);
		avatarUploadRequest.upload.addEventListener('progress', xmlUploadProgress(el), false)
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
					//console.log("111");
					result = self.request.response;
					
					if (result && result.status != 200) {
					//console.log("222");

						alert("Could not upload image\n"+result.err);
					}
				} else {
					// Not ok
					//console.log("333");
					//console.log(self.request.statusText);
					//console.log(self.request.response);
					//alert(self.request.statusText);
				}
			}
		}
	}

	$('#sponsor1AvatarDelete').click(function(){
		//$('#sp1').show();
		//$(this).hide();
		imageDeleteRequest($('#sponsor1AvatarDelete').attr('name'));
		$('#sponsor1Avatar').removeAttr('src');
		$('#sponsor1AvatarDelete').addClass('element-hide');
	});

	$('#sponsor2AvatarDelete').click(function(){
		imageDeleteRequest($('#sponsor2AvatarDelete').attr('name'));
		$('#sponsor2Avatar').removeAttr('src');
		$('#sponsor2AvatarDelete').addClass('element-hide');
	});

	$('#sponsor3AvatarDelete').click(function(){
		imageDeleteRequest($('#sponsor3AvatarDelete').attr('name'));
		$('#sponsor3Avatar').removeAttr('src');
		$('#sponsor3AvatarDelete').addClass('element-hide');
	});

	function imageDeleteRequest(name) {
		//console.log(name);
		$.ajax({
		  	type: "POST",
		  	data: {"_csrf": $("head meta[name=_csrf]").attr('content'), 'name': name},
		  	url: "/event/"+$("head meta[name=event_id]").attr('content')+"/delete/sponsor",
		  	//dataType: "json",
		  	success: function( data) {
	    		//console.log( "delete the image "+ data );
	  		}
		});
	}
})