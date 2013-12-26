angular.module('eventMost')
.controller('commentsController', function($scope, $http, $filter) {
	$scope.comments = [];
	$scope.url = "";
	$scope.user = "";
	$scope.eventid = "";
	$scope.csrf = "";
	$scope.temp_comment = "";
	$scope.commentLimit = 2;
	
	$scope.newComments = [];
	
	var sock = io.connect();
	sock.on('connect', function() {
		if ($scope.eventid.length == 0) return;
		
		sock.emit('register event.comments', {
			event: $scope.eventid
		})
	})
	sock.on('comment', function(message) {
		if (message.attendee.user._id == $scope.user) return;
		
		$scope.newComments.push(message);
		if (!$scope.$$phase) {
			$scope.$digest()
		}
	})
	
	$scope.showNewComments = function () {
		var all = $scope.comments.concat($scope.newComments);
		$scope.newComments = [];
		$scope.comments = $filter('orderBy')(all, 'posted', 'true')
	}
	
	$scope.init = function (opts) {
		$scope.url = "/event/"+opts.id+"/";
		$scope.eventid = opts.id;
		$scope.user = opts.user;
		$scope.csrf = opts.csrf;
		$scope.attendee = opts.attendee;
		
		sock.emit('register event.comments', {
			event: $scope.eventid
		})
		
		$scope.reload()
	}
	
	$scope.reload = function () {
		$http.get($scope.url+'comments').success(function(data, status) {
			$scope.comments = $filter('orderBy')(data.comments, 'posted', 'true');
			$scope.processCommentTime();
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
		
		if (!text || text.length == 0) {
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
		
		$scope.processComment(c);
		
		if (comment) {
			opts.inResponse = comment._id;
			msg.comments.push(c);
		} else {
			$scope.comments.splice(0, 0, c)
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
	
	$scope.processComment = function (comment) {
		var mom = moment(comment.posted);
		comment.postedAgo = mom.fromNow()
		comment.postedFormatted = mom.format('dddd Do MMMM YYYY [at] h:mm:ss a')
	}
	
	$scope.processCommentTime = function () {
		for (var i = 0; i < $scope.comments.length; i++) {
			var comm = $scope.comments[i];
			
			$scope.processComment(comm)
			for (var x = 0; x < comm.comments.length; x++) {
				$scope.processComment(comm.comments[x]);
			}
		}
		
		if (!$scope.$$phase) {
			$scope.$digest();
		}
	}
	
	setInterval(function() {
		$scope.processCommentTime();
	}, 60 * 1000);
})

.directive('commentForm', function() {
	return {
		restrict: 'A',
		scope: { comment: '=', text: '@' },
		link: function(scope, element, attrs) {
			scope.submitComment = function (comment) {
				if (comment) {
					scope.comment.showComments = true;
				}
				
				scope.$parent.submitComment(scope.text, comment);
				scope.text = '';
			}
			
			$(element).keyup(function(e) {
				if (e.keyCode == 13) {
					scope.submitComment(scope.comment)
				}
			})
		}
	}
})
.directive('submitComment', function() {
	return {
		restrict: 'A',
		link: function(s, element) {
			$(element).click(function() {
				var elem = $(element).parent().find('input');
				if (elem.length == 0) {
					elem = $('textarea.postcommentarea1');
				}
				
				var scope = angular.element(elem).scope()
				
				scope.submitComment(scope.comment)
			})
		}
	}
})