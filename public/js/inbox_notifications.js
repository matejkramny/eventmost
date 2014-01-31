angular.module('eventMost')
.controller('inboxNotifications', function($scope, $http, $rootScope) {
	$scope.notifications = 0;
	
	var sock = io.connect();
	
	sock.on('inbox notification', function(data) {
		$scope.notifications = data.mailboxUnread;
		
		if (!$scope.$$phase) {
			$scope.$digest();
		}
	});
})