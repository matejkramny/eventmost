angular.module('eventMost')
.directive('uploadFile', function() {
	return {
		restrict: 'A',
		link: function($rootScope, element, attrs) {
			var uploadRequest;
			var parseToJson = false;
			
			function progressHandler (ev) {
				if (ev.lengthComputable) {
					var percent = Math.round(ev.loaded * 100 / ev.total);
					$rootScope.progress = percent;
					if (!$rootScope.$$phase) {
						$rootScope.$digest();
					}
				}
			}
			
			function responseHandler () {
				if (uploadRequest.readyState != 4) {
					return;
				}
				
				if (uploadRequest.status == 200) {
					result = uploadRequest.response;
					
					if (parseToJson) {
						result = JSON.parse(uploadRequest.responseText);
					}
					$rootScope.progress = 100;
					
					if (result.status != 200) {
						alert("Could not upload file :(\n"+result.err);
					} else {
						window.location.reload();
					}
				} else {
					// Not ok
					alert("Upload Failed:\n"+uploadRequest.statusText);
				}
			}
			
			element.bind('click', function(ev) {
				ev.preventDefault();
				
				$(attrs.file).trigger('click');
				throw Error("Woooooooot");
				return false;
			})
			
			$(attrs.file).change(function() {
				$rootScope.progress = 0;
				
				var files = this.files;
		
				for (var i = 0; i < files.length; i++) {
					file = files[i];
					break;
				}
		
				if (typeof file === "undefined" || file == null) {
					return;
				}
				
				var form = new FormData();
				form.append("_csrf", attrs['csrf']);
				form.append("upload", file);
				
				uploadRequest = new XMLHttpRequest();
				try {
					uploadRequest.responseType = "json";
				} catch (e) {
					parseToJson = true;
				}
				uploadRequest.open("POST", attrs['url'], true);
				uploadRequest.setRequestHeader('Accept', 'application/json');
				uploadRequest.onreadystatechange = responseHandler;
				uploadRequest.upload.addEventListener('progress', progressHandler, false)
				
				uploadRequest.send(form);
			})
		}
	}
})