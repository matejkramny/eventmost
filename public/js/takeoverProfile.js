angular.module('eventMost')
.controller('TakeoverController', function($scope, $http) {
	$scope.peopleSearch = [];
	$scope.search = "";
	$scope.email = "";
	$scope.showAction = false;
	$scope.field = "";
	$scope.showPeopleSearch = false;
	$scope.progress = "";
	$scope.csrf = "";
	$scope.selectedProfile = null;
	
	$scope.setCsrf = function (csrf) {
		$scope.csrf = csrf;
	}
	
	$scope.doEmail = function () {
		$scope.showAction = true;
	}
	
	$scope.searchUser = function () {
		$scope.progress = "Searching for "+$scope.search;
		$http.get("/search/people/?q="+$scope.search).success(function(data, status) {
			$scope.showPeopleSearch = true;
			$scope.peopleSearch = data.results;
			$scope.progress = "";
		})
	}
	$scope.selectProfile = function (profile) {
		$scope.showAction = true;
		$scope.selectedProfile = profile;
		$scope.showPeopleSearch = false;
	}
	
	$scope.sendInvite = function () {
		$http.post('inbox/takeover')
	}
	$scope.sendInbox = function () {
		$scope.progress = "Sending Inbox.."
		$http.post('inbox/sendInbox', {
			_csrf: $scope.csrf,
			field: $scope.selectedProfile != null ? $scope.selectedProfile._id : $scope.email
		}).success(function(data, status) {
			var status = data.status;
			
			if (status == 200) {
				$scope.progress = "Inbox Sent!"
			} else {
				$scope.progress = "Inbox failed to send because: "+data.message
			}
		})
	}
})