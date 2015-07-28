(function($){
			$(window).load(function(){
				
				$("#content-1").mCustomScrollbar({
					theme:"minimal",
          scrollInertia: 0
				});
				
				$("#content-2").mCustomScrollbar({
					theme:"minimal",
          scrollInertia: 0
				});
				
			});
		})(jQuery);

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
				messages: data.messages,
				otherUser: message.otherUser
			}
			$scope.calculateTime();
			setTimeout($scope.calculateTime, 50);
		});
	}
	
	$scope.calculateTime = function () {
		if ($scope.message == null || $scope.message.messages == null) return;
		
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
	
	$scope.processOtherUser = function () {
		for (var i = 0; i < $scope.messages.length; i++) {
			var m = $scope.messages[i];
			for (var x = 0; x < m.topic.users.length; x++) {
				if (m.topic.users[x] && m.topic.users[x]._id != $scope.user) {
					m.otherUser = m.topic.users[x];
					if (m.otherUser.avatarSorted !== true) {
						m.otherUser.avatarSorted = true;
						if (!m.otherUser.avatar || m.otherUser.avatar.length == 0) {
							m.otherUser.avatar = "/images/default_speaker.svg";
						} else {
							m.otherUser.avatar += '-116x116.png';
						}
					}
					
					break;
				}
			}
			
			m.unread = 0;
		}
	}
	
	$http.get('/inbox/messages').success(function(data, status) {
		$scope.messages = data.messages;
		$scope.processOtherUser();
		
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
		$http.get("/search/?type=people&q="+$scope.search).success(function(data, status) {
			$scope.showPeopleSearch = true;
			$scope.peopleSearch = data.results;
			$scope.progress = "";
		})
	}
	$scope.selectProfile = function (profile) {
		$scope.search = "";
		$scope.peopleSearch = [];
		
		for (var i = 0; i < $scope.messages.length; i++) {
			var m = $scope.messages[i];
			for (var x = 0; x < m.topic.users.length; x++) {
				if (m.topic.users[x] && m.topic.users[x]._id == profile._id) {
					$scope.selectMessage(m);
					return;
				}
			}
		}
		
		$scope.progress = "Creating message to "+profile.name +" "+profile.surname;
		$http.post('/inbox/messages/new?to='+profile._id, { _csrf: $scope.csrf })
			.success(function(data, status) {
				$scope.messages.splice(0, 0, data.message);
				$scope.selectMessage($scope.messages[0]);
				$scope.progress = "";
				$scope.showPeopleSearch = false;
				$scope.processOtherUser();
			})
			.error(function(data, status) {
				$scope.status = "Something went wrong :/";
			})
		$scope.selectedProfile = profile;
		$scope.showPeopleSearch = false;
	}
	
	setTimeout($scope.calculateTime, 60 * 1000);
})