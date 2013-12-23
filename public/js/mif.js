angular.module('eventMost')
.controller('commentsController', function($scope, $http, $filter) {
	$scope.comments = [];
	$scope.url = "";
	$scope.user = "";
	$scope.csrf = "";
	$scope.temp_comment = "";
	$scope.commentLimit = 2;
	
	$scope.init = function (opts) {
		$scope.url = opts.url;
		$scope.user = opts.user;
		$scope.csrf = opts.csrf;
		$scope.attendee = opts.attendee;
		
		$scope.reload()
	}
	
	$scope.reload = function () {
		$http.get($scope.url+'comments').success(function(data, status) {
			$scope.comments = $filter('orderBy')(data.comments, 'posted', 'true');
		})
	}
	
	$scope.submitComment = function (text, comment) {
		var msg;
		
		if (typeof comment === 'undefined') {
			comment = null;
		}
		
		if (comment) {
			msg = comment;
		} else {
			msg = $scope;
		}
		
		if (text.length == 0) {
			return;
		}
		
		var c = {
			message: text,
			attendee: $scope.attendee,
			likes: [],
			comments: [],
			posted: Date.now()
		};
		
		var opts = {
			_csrf: $scope.csrf,
			message: text
		}
		
		if (comment) {
			opts.inResponse = comment._id;
			msg.comments.push(c);
		} else {
			msg.comments.splice(0, 0, c)
		}
		
		$http.post($scope.url+'comment', opts)
		.success(function(data, status) {
			c._id = data.cid;
		})
	}
	
	$scope.likeComment = function (comment) {
		for (var i = 0; i < comment.likes.length; i++) {
			if (comment.likes[i]._id == $scope.attendee._id) {
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

.directive('commentForm', function() {
	return {
		restrict: 'A',
		scope: { comment: '=', text: '@' },
		link: function(scope, element, attrs) {
			$(element).keyup(function(e) {
				if (e.keyCode == 13) {
					if (scope.comment) {
						scope.comment.showComments = true;
						scope.$parent.submitComment(scope.text, scope.comment);
					} else {
						scope.$parent.submitComment(scope.text);
					}
					scope.text = '';
				}
			})
		}
	}
})