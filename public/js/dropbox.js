angular.module('eventMost')
.controller('dropboxSharingController', function($scope, $http) {
	$scope.file = null;
	$scope.categories = [];
	$scope.attendees = [];
	
	$scope.setFile = function (file) {
		$scope.file = file;
	}
	
	$scope.setCategories = function (categories) {
		$scope.categories = categories;
	}
	
	$scope.setAttendees = function (attendees) {
		$scope.attendees = attendees;
	}
	
})