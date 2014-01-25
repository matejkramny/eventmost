angular.module('eventMost', [])
.controller('eventAttendees', function($scope, $http) {
	$scope.url = "";
	$scope.admin = false;
	$scope.attendees = [];
	$scope.search = "";
	
	$scope.init = function (opts) {
		$scope.url = opts.url;
		$scope.admin = opts.admin;
		$scope.csrf = opts.csrf;
		
		$scope.reload()
	}
	
	$scope.searchName = function (attendee) {
		if ($scope.search.length == 0) return true;
		
		if (attendee.user.name.toLowerCase().indexOf($scope.search.toLowerCase()) > -1) {
			return true;
		}
		
		return false;
	}
	
	$scope.reload = function () {
		$http.get($scope.url+"/attendees").success(function(data, status) {
			$scope.attendees = data.attendees;
			for (var i = 0; i < $scope.attendees.length; i++) {
				if (typeof $scope.attendees[i].checkedOff === 'undefined') {
					$scope.attendees[i].checkedOff = false;
				}
			}
			console.log($scope.attendees)
			
			if (!$scope.$$phase) {
				$scope.$digest();
			}
		})
	}
	
	$scope.checkOff = function (attendee) {
		attendee.checkedOff = !attendee.checkedOff;
		
		$http.put($scope.url+'/attendee/'+attendee._id+'/'+(attendee.checkedOff == false ? 'un' : '')+'register', {
			_csrf: $scope.csrf
		})
	}
})