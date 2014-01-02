angular.module('eventMost')
.controller('inboxController', function($scope, $http, $filter) {
	$scope.messages = [];
	$scope.message = {};
	$scope.msg = "";
	$scope.peopleSearch = [];
	$scope.search = "";
	$scope.progress = "";
	$scope.showPeopleSearch = false;
	$scope.csrf = "";
	
	var sock = io.connect();
	sock.on('connect', function() {
		console.log("Connected")
	})
	
	sock.on('inbox notification', function(data) {
		for (var i = 0; i < $scope.messages.length; i++) {
			if ($scope.messages[i].topic._id == data.topic._id) {
				if (data.topic._id == $scope.message.message._id) {
					$scope.message.messages.push(data.message);
				} else {
					$scope.messages[i].unread++;
				}
				
				$scope.calculateTime();
				
				break;
			}
		}
	})
	
	$scope.init = function (opts) {
		$scope.csrf = opts.csrf;
		$scope.user = opts.user;
	}
	
	$scope.selectMessage = function (message) {
		message.unread = 0;
		$http.get('/inbox/message/'+message.topic._id).success(function(data, status) {
			$scope.message = {
				message: data.message,
				messages: data.messages
			}
			$scope.calculateTime();
			setTimeout($scope.calculateTime, 50);
		});
	}
	
	$scope.calculateTime = function () {
		$scope.message.messages = $filter('orderBy')($scope.message.messages, 'timeSent')
		for (var i = 0; i < $scope.message.messages.length; i++) {
			$scope.message.messages[i].time = moment($scope.message.messages[i].timeSent).fromNow()
		}
		
		if (!$scope.$$phase) {
			$scope.$digest();
		}
		$('#messages').scrollTop($('#messages')[0].scrollHeight);
	}
	
	$scope.sendMessage = function () {
		$http.post('/inbox/message/'+$scope.message.message._id, {
			_csrf: $scope.csrf,
			message: $scope.msg
		})
		$scope.msg = "";
	}
	
	$http.get('/inbox/messages').success(function(data, status) {
		$scope.messages = data.messages;
		for (var i = 0; i < $scope.messages.length; i++) {
			var m = $scope.messages[i];
			for (var x = 0; x < m.topic.users.length; x++) {
				if (m.topic.users[x] && m.topic.users[x]._id != $scope.user) {
					m.otherUser = m.topic.users[x];
					break;
				}
			}
			
			m.unread = 0;
		}
		
		if ($scope.messages.length > 0) {
			$scope.selectMessage($scope.messages[0])
		} else {
			$scope.message = null;
		}
	});
	
	$('#inputMessage').keyup(function(e) {
		if (e.keyCode == 13) {
			$scope.sendMessage();
		}
	})
	
	$scope.searchUser = function () {
		$scope.progress = "Searching for "+$scope.search;
		$http.get("/search/people/?q="+$scope.search).success(function(data, status) {
			$scope.showPeopleSearch = true;
			$scope.peopleSearch = data.results;
			$scope.progress = "";
		})
	}
	$scope.selectProfile = function (profile) {
		$scope.progress = "Creating message to "+profile.name +" "+profile.surname;
		//TODO make post to create message. then switch to the message....
		$http.post('/inbox/messages/new?to='+profile._id, { _csrf: $scope.csrf })
			.success(function(data, status) {
				$scope.messages.splice(0, 0, data.message);
				$scope.selectMessage($scope.messages[0]);
			})
			.error(function(data, status) {
				$scope.status = "Something went wrong :/";
			})
		$scope.selectedProfile = profile;
		$scope.showPeopleSearch = false;
	}
	
	setTimeout($scope.calculateTime, 60 * 1000);
})