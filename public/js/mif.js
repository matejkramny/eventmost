angular.module('eventMost')
.controller('commentsController', function($scope, $http) {
	$scope.comments = [];
	$scope.url = "";
	$scope.user = "";
	$scope.csrf = "";
	$scope.temp_comment = "";
	
	$scope.init = function (opts) {
		$scope.url = opts.url;
		$scope.user = opts.user;
		$scope.csrf = opts.csrf;
		$scope.attendee = opts.attendee;
		
		$scope.reload()
	}
	
	$scope.reload = function () {
		$http.get($scope.url+'comments').success(function(data, status) {
			$scope.comments = data.comments;
			console.log(data.comments)
		})
	}
	
	$scope.submitComment = function (comment) {
		var msg;
		if (comment) {
			msg = comment;
		} else {
			msg = $scope;
		}
		
		if (msg.temp_comment.length == 0) {
			return;
		}
		
		var c = {
			message: msg.temp_comment,
			attendee: $scope.attendee,
			likes: [],
			comments: [],
			posted: Date.now()
		};
		
		msg.comments.push(c)
		
		var opts = {
			_csrf: $scope.csrf,
			message: msg.temp_comment
		}
		
		if (comment) {
			opts.inResponse = comment._id
		}
		
		$http.post($scope.url+'comment', opts)
		.success(function(data, status) {
			msg.temp_comment = "";
			c._id = data.cid;
		})
	}
	
	$scope.likeComment = function (comment) {
		for (var i = 0; i < comment.likes.length; i++) {
			if (comment.likes[i].attendee._id == $scope.attendee._id) {
				return;
			}
		}
		
		comment.likes.push($scope.attendee)
		
		$http.post($scope.url+'like', {
			_csrf: $scope.csrf,
			comment: comment._id
		})
	}
})