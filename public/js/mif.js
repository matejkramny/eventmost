angular.module('eventMost')
.controller('commentsController', function($scope, $http) {
	$scope.comments = [];
	$scope.url = "";
	$scope.user = "";
	$scope.csrf = "";
	
	$scope.init = function (opts) {
		$scope.url = opts.url;
		$scope.user = opts.user;
		$scope.csrf = opts.csrf;
		
		$scope.reload()
	}
	
	$scope.reload = function () {
		$http.get($scope.url+'comments').success(function(data, status) {
			$scope.comments = data.comments;
			console.log(data.comments)
		})
	}
	
	$scope.submitSubComment = function (comment) {
		var msg = comment.temp_comment;
		if (msg.length == 0) {
			return;
		}
		
		comment.temp_comment = "Sending.."
		
		$http.post($scope.url+'comment', {
			_csrf: $scope.csrf,
			inResponse: comment._id,
			message: msg
		}).success(function(data, status) {
			comment.temp_comment = "";
		})
	}
	
})