function BusinessCards ($scope) {
	$scope.libraryBoxes = [];
	$scope.libraryBox = {};
	$scope.boxId = "";
	
	$scope.preview = false;
	
	$scope.canvasStyles = {
		backgroundColor: "#FFFFFF"
	};
	
	$scope.createTextBox = function () {
		var index = $scope.libraryBoxes.length
		var box = {
			enabled: true,
			image: false,
			type: "Text",
			id: "box"+index,
			text: "Text Value",
			style: {
				fontSize: 13,
				fontStyle: "normal",
				fontWeight: "normal",
				fontFamily: "Raleway",
				color: "#FFFFFF",
				background: "none",
				paddingLeft: 0,
				
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
}

var eventMost = angular.module('eventMost', []);
eventMost.controller('businessCards', BusinessCards)
.directive('cardDirective', function() {
	return function($scope, $element, $attrs) {
		$element.draggable({
			containment: $("#cardCanvas"),
			handle: '.handle',
		}).resizable({
			containment: $("#cardCanvas"),
			handles: "n, e, s, w, ne, se, sw, nw",
			minHeight: 20,
			minWidth: 25
		});
	}
})
.directive('canvasDroppable', function() {
	return function($scope, $element, $attrs) {
		$element.droppable({
			drop: function(ev, ui) {
				
			}
		})
	}
})