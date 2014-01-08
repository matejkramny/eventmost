angular.module('eventMost')
.directive('uploadFile', function() {
	return {
		restrict: 'A',
		link: function($rootScope, element, attrs) {
			var uploadRequest;
			
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
				if (uploadRequest.readyState == 4) {
					if (uploadRequest.status == 200) {
						result = uploadRequest.response;
						
						$rootScope.progress = 100;
						
						if (result.status != 200) {
						//	alert("Could not upload file :(\n"+result.err);
						} else {
						//	window.location.reload();
						}
					} else {
						// Not ok
						alert(uploadRequest.statusText);
					}
				}
			}
			
			element.bind('click', function(ev) {
				ev.preventDefault();
				
				$(attrs.file).trigger('click');
				
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
				uploadRequest.open("POST", attrs['url'], true);
				uploadRequest.responseType = "json";
				uploadRequest.setRequestHeader('Accept', 'application/json');
				uploadRequest.onreadystatechange = responseHandler;
				uploadRequest.upload.addEventListener('progress', progressHandler, false)
				
				uploadRequest.send(form);
			})
		}
	}
})