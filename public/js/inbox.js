angular.module('eventMost')
.controller('inboxController', function($scope, $http) {
	$scope.messages = [];
	$scope.message = {};
	
	$scope.selectMessage = function (message) {
		$scope.message = message;
		$http.get('/inbox/message/'+message.topic._id).success(function(data, status) {
			$scope.message = {
				message: data.message,
				messages: data.messages
			}
		});
	}
	
	$scope.sendMessage = function () {
		$scope.message.messages.push({
			message: $scope.msg,
			timeSent: "now"
		})
	}
	
	$http.get('/inbox/messages').success(function(data, status) {
		$scope.messages = data.messages;
	});
})