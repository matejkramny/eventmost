angular.module('eventMost')
.controller('commentsController', function($scope, $http, $filter) {
	$scope.comments = [];
	$scope.url = "";
	$scope.user = "";
	$scope.eventid = "";
	$scope.csrf = "";
	$scope.temp_comment = "";
	$scope.commentLimit = 2;
	
	var sock = io.connect();
	sock.on('connect', function() {
		if ($scope.eventid.length == 0) return;
		
		sock.emit('register event.comments', {
			event: $scope.eventid
		})
	})
	sock.on('comment', function(message) {
		if (message.attendee.user._id == $scope.user) return;
		
		if (message.inResponse) {
			for (var i = 0; i < $scope.comments.length; i++) {
				if ($scope.comments[i]._id == message.responseTo) {
					$scope.comments[i].comments.push(message);
				}
			}
		} else {
			$scope.comments.splice(0, 0, message);
			$scope.processCommentTime();
			$scope.comments = $filter('orderBy')($scope.comments, 'moment', 'true')
		}
		
		if (!$scope.$$phase) {
			$scope.$digest()
		}
	})
	sock.on('like', function(data) {
		if (data.attendee.user._id == $scope.user) return;
		
		for (var i = 0; i < $scope.comments.length; i++) {
			if ($scope.comments[i]._id == data.comment) {
				$scope.comments[i].likes.push(data.attendee);
				break;
			}
			
			for (var x = 0; x < $scope.comments[i].comments.length; x++) {
				if ($scope.comments[i].comments[x]._id == data.comment) {
					$scope.comments[i].comments[x].likes.push(data.attendee);
					break;
				}
			}
		}
		
		if (!$scope.$$phase) {
			$scope.$digest();
		}
	})
	
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
			$scope.comments = data.comments;
			
			$scope.processCommentTime();
			
			$scope.comments = $filter('orderBy')($scope.comments, 'moment', 'true');
			for (var i = 0; i < $scope.comments.length; i++) {
				$scope.comments[i].comments = $filter('orderBy')($scope.comments[i].comments, 'moment', 'false');
			}
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
	
	$scope.deleteComment = function (comment, parent) {
		var cid = comment._id;
		
		if (typeof parent != 'undefined') {
			for (var i = 0; i < parent.comments.length; i++) {
				if (parent.comments[i]._id == cid) {
					parent.comments.splice(i, 1);
					break;
				}
			}
		} else {
			for (var i = 0; i < $scope.comments.length; i++) {
				if ($scope.comments[i]._id == cid) {
					$scope.comments.splice(i, 1);
					break;
				}
			}
		}
		
		$http.delete($scope.url+'comment/'+cid+"?_csrf="+$scope.csrf).success(function(data, status) {
			console.log("Comment deleted..")
		})
		
		if (!$scope.$$phase) {
			$scope.$digest();
		}
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
		
		$scope.processCommentTime();
	}
	
	$scope.processComment = function (comment) {
		var mom = moment(comment.posted);
		comment.moment = mom;
		comment.postedAgo = mom.fromNow()
		comment.postedFormatted = mom.format('dddd Do MMMM YYYY [at] h:mm:ss a')
		
		comment.showLike = true;
		for (var i = 0; i < comment.likes.length; i++) {
			if (comment.likes[i].user._id == $scope.user) {
				comment.showLike = false;
				break;
			}
		}
		
		if (comment.attendee.user.avatarSorted !== true) {
			comment.attendee.user.avatarSorted = true;
			if (!comment.attendee.user.avatar || comment.attendee.user.avatar.length == 0) {
				comment.attendee.user.avatar = '/images/default_speaker-purple.svg';
			} else {
				comment.attendee.user.avatar += '-116x116.png';
			}
		}
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