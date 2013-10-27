function BusinessCards ($scope) {
	$scope.libraryBoxes = [];
	$scope.libraryBox = {};
	$scope.boxId = "";
	
	$scope.hasTemplateBackground = false;
	$scope.hasBackgroundImage = false;
	
	$scope.canvasStyles = {
		backgroundColor: "#FFFFFF",
		width: "500px",
		height: "250px"
	};
	
	$scope.sendCard = function () {
		$.ajax({
			type: "POST",
			dataType: "json",
			url: "/card/new",
			data: {
				html: $("#cardCanvas").html(),
				_csrf: $("head meta[name=_csrf]").attr('content')
			},
			success: function(data, status, jqxhr) {
				if (data.status == 200) {
					window.location = '/cards';
				}
			}
		})
	}
	
	$scope.$watch('libraryBox.blackandwhite', function () {
		if (!$scope.libraryBox || !$scope.libraryBox.style) return;
		
		var scale = "grayscale("+$scope.libraryBox.blackandwhite+"%)";
		$scope.libraryBox.style.filter = scale;
		$scope.libraryBox.style["-webkit-filter"] = scale;
	});
	
	
	$scope.createTextBox = function () {
		var index = $scope.libraryBoxes.length
		var box = {
			enabled: true,
			image: false,
			type: "Text",
			id: "box"+index,
			text: "Text Box",
			style: {
				fontSize: 20,
				fontStyle: "normal",
				fontWeight: "normal",
				fontFamily: "Arial",
				color: "#000000",
				background: "none",
				paddingLeft: 15,
				
				borderStyle: "none",
				borderWidth: 0,
				borderColor: "#FFFFFF",
				borderRadius: 0
			}
		};
		$scope.createBox(box);
	}
	$scope.createImage = function () {
		var index = $scope.libraryBoxes.length
		var box = {
			enabled: true,
			image: true,
			type: "Image",
			hasBackgroundImage: false,
			id: "box"+index,
			text: "Image "+index,
			style: {
				backgroundColor: "#000000",
				
				borderStyle: "none",
				borderWidth: 0,
				borderColor: "#FFFFFF",
				borderRadius: 0
			}
		};
		$scope.createBox(box);
	}
	
	$scope.createBox = function (box) {
		$scope.libraryBoxes.push(box);
		$scope.selectBox($scope.libraryBoxes[$scope.libraryBoxes.length-1]);
	}
	
	$scope.selectBox = function (box) {
		$scope.libraryBox = box;
		$scope.boxId = box.id;
	}
	
	$scope.removeElement = function () {
		for (var i = 0; i < $scope.libraryBoxes.length; i++) {
			var b = $scope.libraryBoxes[i];
			if (b == $scope.libraryBox) {
				$scope.libraryBoxes.splice(i, 1);
				$scope.libraryBox = null;
				break;
			}
		}
	}
	
	$scope.changeBox = function() {
		var boxes = $scope.libraryBoxes;
		var id = $scope.boxId;
		for (var i = 0; boxes.length; i++) {
			if (boxes[i].id == id) {
				$scope.selectBox(boxes[i]);
				break;
			}
		}
	}
	
	$scope.selectTemplate = function (id) {
		$scope.canvasStyles.background = "url(/images/businessCardTemplates/"+id+".svg) no-repeat top left"
		$scope.canvasStyles.backgroundSize = "500px 250px"
		$scope.hasTemplateBackground = true;
		$("#businessCardLibrary").modal('hide');
	}
	$scope.removeTemplate = function () {
		delete $scope.canvasStyles.background;
		delete $scope.canvasStyles.backgroundSize;
		$scope.hasTemplateBackground = false
	}
	
	$scope.removeBackgroundImage = function () {
		delete $scope.canvasStyles.background;
		delete $scope.canvasStyles.backgroundSize;
		$scope.canvasStyles.backgroundColor = "#FFFFFF";
		$scope.hasBackgroundImage = false;
	}
	
	$scope.removeBoxBackgroundImage = function () {
		delete $scope.libraryBox.style.background;
		delete $scope.libraryBox.style.backgroundSize;
		$scope.libraryBox.style.backgroundColor = "#000000";
		$scope.libraryBox.hasBackgroundImage = false;
	}
}

var eventMost = angular.module('eventMost', []);
eventMost.controller('businessCards', BusinessCards)
.directive('cardDirective', function() {
	return function(scope, element, attrs) {
		element.css("width", "200px")
		.css("height", "50px")
		
		element.draggable({
			containment: $("#cardCanvas .canvas"),
			handle: '.handle',
		}).resizable({
			containment: $("#cardCanvas .canvas"),
			handles: "e, s, n, w, se, sw, ne, nw",
			minHeight: 20,
			minWidth: 25
		});
	}
})
.directive('canvasDroppable', function() {
	return function(scope, element, attrs) {
		element.droppable({
			drop: function(ev, ui) {
				
			}
		})
	}
})
.directive('cardImageUpload', function() {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			element.bind('change', function() {
				// Upload file
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
					scope.$apply(function () {
						var target = attrs.uploadTarget || "background";
						var applyTo;
						
						if (target == 'background') {
							applyTo = scope.canvasStyles
							scope.hasBackgroundImage = true;
						} else if (target == 'image') {
							applyTo = scope.libraryBox.style
							scope.libraryBox.hasBackgroundImage = true;
						}
						
						applyTo.backgroundColor = "";
						applyTo.background = 'url('+img.target.result+') no-repeat top left';
						applyTo.backgroundSize = '100% 100%';
					})
				}
				reader.readAsDataURL(file);
			});
		}
	}
})