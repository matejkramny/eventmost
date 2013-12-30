angular.module('eventMost')
.controller('inboxController', function($scope, $http, $filter) {
	$scope.messages = [];
	$scope.message = {};
	$scope.msg = "";
	$scope.peopleSearch = [];
	$scope.search = "";
	$scope.progress = "";
	$scope.showPeopleSearch = false;
	
	var sock = io.connect();
	sock.on('connect', function() {
		console.log("Connected")
	})
	
	sock.on('inbox notification', function(data) {
		if ($scope.message.message._id == data.topic._id) {
			$scope.message.messages.push(data.message)
			
			$scope.calculateTime();
		}
	})
	
	$scope.init = function (opts) {
		$scope.csrf = opts.csrf;
	}
	
	$scope.selectMessage = function (message) {
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
		if ($scope.messages.length > 0) {
			$scope.selectMessage($scope.messages[0])
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
		$scope.selectedProfile = profile;
		$scope.showPeopleSearch = false;
	}
	
	setTimeout($scope.calculateTime, 60 * 1000);
})