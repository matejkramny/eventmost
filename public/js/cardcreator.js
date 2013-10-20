function BusinessCards ($scope) {
	$scope.libraryBoxes = [];
	$scope.libraryBox = {};
	$scope.boxId = "";
	
	$scope.hasTemplateBackground = false;
	$scope.preview = false;
	
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
	
	$scope.createTextBox = function () {
		var index = $scope.libraryBoxes.length
		var box = {
			enabled: true,
			image: false,
			type: "Text",
			id: "box"+index,
			text: "Text Value",
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
			id: "box"+index,
			text: "Image "+index,
			src: "",
			style: {
				backgroundColor: "transparent",
				
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
	
	$scope.togglePreviewMode = function () {
		$scope.preview = !$scope.preview;
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
		$scope.hasTemplateBackground = true
	}
	$scope.removeTemplate = function () {
		delete $scope.canvasStyles.background;
		delete $scope.canvasStyles.backgroundSize;
		$scope.hasTemplateBackground = false
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
			handles: "n, e, s, w, ne, se, sw, nw",
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