function BusinessCards ($scope) {
	$scope.libraryBoxes = [];
	$scope.libraryBox = {};
	
	$scope.createTextBox = function () {
		var box = {
			enabled: true,
			id: "box"+$scope.libraryBoxes.length,
			text: "Hello there buddy "+$scope.libraryBoxes.length,
			style: {
				borderStyle: "none",
				borderWidth: 0,
				borderColor: "#FFF000",
				fontSize: 13,
				color: "#FFFFFF"
			}
		};
		$scope.libraryBoxes.push(box);
	}
	$scope.selectBox = function (box) {
		$scope.libraryBox = box
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
}

var eventMost = angular.module('eventMost', []);
eventMost.controller('businessCards', BusinessCards)
.directive('cardDirective', function() {
	return function($scope, $element, $attrs) {
		$element.draggable({
			containment: $("#cardCanvas"),
			handle: '.handle'
		}).resizable({
			containment: $("#cardCanvas")
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