var eventMost = angular.module('emAdmin', [])

.controller('usersController', function($scope, $http) {
	$scope.users = []
	
	$http.get('/admin/users')
	.success(function(data, status) {
		for (var i = 0; i < data.users.length; i++) {
			data.users[i].created = new Date(data.users[i].created);
		}
		$scope.users = data.users;
	})
	
	$scope.setCsrf = function(csrf) {
		$scope.csrf = csrf;
	}
	
	$scope.removeUser = function(user) {
		var users = $scope.users;
		for (var i = 0; i < users.length; i++) {
			if (users[i]._id == user._id) {
				$scope.users.splice(i, 1);
				break;
			}
		}
		
		$http.post("/admin/users/"+user._id+"/remove", {
			_csrf: $scope.csrf
		})
	}
	
	$scope.opUser = function (user) {
		user.admin = true;
		
		$http.post("/admin/users/"+user._id+"/op", {
			_csrf: $scope.csrf
		})
	}
	
	$scope.deopUser = function (user) {
		user.admin = false;
		
		$http.post("/admin/users/"+user._id+"/deop", {
			_csrf: $scope.csrf
		})
	}
})