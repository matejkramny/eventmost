var isLocalStorageCapable = false;
try {
	if ('localStorage' in window && window['localStorage'] !== null) {
		isLocalStorageCapable = true;
	}
} catch (e) {}

var eventMost = angular.module('emAdmin', [])

.controller('usersController', function($scope, $http) {
	$scope.allUsers = []
	$scope.users = [];
	$scope.user = null;
	
	$scope.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	$scope.month = $scope.months[moment().month()];
	$scope.years = [];
	$scope.year = moment().year();
	$scope.showLine = true;
	if (isLocalStorageCapable) {
		if (typeof localStorage['admin-saved'] !== 'undefined') {
			$scope.month = localStorage['admin-month'] == "null" ? null : localStorage['admin-month'];
			$scope.year = parseInt(localStorage['admin-year']);
			$scope.showLine = (parseInt(localStorage['admin-showLine']) == 0 ? false : true);
		}
	}
	
	$('.highchart').highcharts({
        title: {
            text: 'Signups Over Time',
            x: -20 //center
        },
		xAxis: {
			categories: []
		},
        yAxis: {
            title: {
				text: '# of Signups'
            },
			min: 0,
			allowDecimals: false,
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
        legend: {
			enabled: false
        },
		series: [],
		credits: {
			enabled: false
		}
    });
	
	$http.get('/admin/users')
	.success(function(data, status) {
		for (var i = 0; i < data.users.length; i++) {
			data.users[i].created = new Date(data.users[i].created);
		}
		$scope.allUsers = data.users;
		
		$scope.aggregateScopeSelectors();
		$scope.drawGraph()
	})
	
	$scope.setCsrf = function(csrf) {
		$scope.csrf = csrf;
	}
	
	$scope.removeUser = function(user) {
		if (user.askedConfirm != true) {
			user.askedConfirm = true;
			return;
		}
		
		user.disabled = true;
		user.askedConfirm = false;
		
		var users = $scope.allUsers;
		for (var i = 0; i < users.length; i++) {
			if (users[i]._id == user._id) {
				$scope.allUsers.splice(i, 1);
				break;
			}
		}
		
		$http.post("/admin/users/"+user._id+"/remove", {
			_csrf: $scope.csrf
		})
	}
	
	$scope.opUser = function (user) {
		user.admin = true;
		
		$http.post("/admin/users/"+user._id+"/op", {
			_csrf: $scope.csrf
		})
	}
	
	$scope.deopUser = function (user) {
		user.admin = false;
		
		$http.post("/admin/users/"+user._id+"/deop", {
			_csrf: $scope.csrf
		})
	}
	
	$scope.editUser = function (user) {
		$scope.user = user;
		$("#userModal").modal('show')
	}
	
	$scope.aggregateScopeSelectors = function () {
		var years = [];
		
		for (var i = 0; i < $scope.allUsers.length; i++) {
			var user = $scope.allUsers[i];
			
			var date = new Date(user.created);
			var year = date.getFullYear();
			
			var found = false;
			for (var x = 0; x < years.length; x++) {
				if (years[x] == year) {
					found = true;
					break;
				}
			}
			if (!found) {
				years.push(year);
			}
		}
		
		$scope.years = years;
	}
	
	$scope.drawGraph = function () {
		if (isLocalStorageCapable) {
			localStorage['admin-saved'] = Date.now();
			localStorage['admin-showLine'] = $scope.showLine == false ? 0 : 1;
			localStorage['admin-year'] = $scope.year;
			localStorage['admin-month'] = $scope.month;
		}
		
		if ($scope.month == null) {
			$scope.drawYear($scope.year);
		} else {
			$scope.drawMonth($scope.month);
		}
	}
	
	$scope.drawYear = function (year) {
		var months = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		$scope.users = [];
		
		for (var i = 0; i < $scope.allUsers.length; i++) {
			var user = $scope.allUsers[i];
			
			var date = new Date(user.created);
			var month = date.getMonth();
			var _year = date.getFullYear();
			
			if (year != _year) continue;
			
			$scope.users.push(user);
			months[month]++;
		}
		
		var chart = $('.highchart').highcharts();
		
		for (var i = 0; i < chart.series.length; i++) {
			chart.series[i].remove();
		}
		
		chart.xAxis[0].categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		chart.addSeries({
            name: 'Users',
			color: '#18bc9c',
			type: $scope.showLine ? 'spline' : 'bar',
            data: months
        })
	}
	
	$scope.drawMonth = function (month) {
		$scope.users = [];
		var days = [];
		var dayNames = [];
		var numDays = moment().daysInMonth();
		for (var i = 0; i < numDays; i++) {
			days.push(0);
			dayNames.push("" + (i+1));
		}
		
		for (var i = 0; i < $scope.allUsers.length; i++) {
			var user = $scope.allUsers[i];
			
			var m = moment(new Date(user.created));
			var _month = $scope.months[m.month()];
			if (_month != month) continue;
			if (m.year() != $scope.year) continue;
			
			$scope.users.push(user);
			
			days[m.date()]++;
		}
		
		var chart = $('.highchart').highcharts();
		
		for (var i = 0; i < chart.series.length; i++) {
			chart.series[i].remove();
		}
		
		chart.xAxis[0].categories = dayNames
		chart.addSeries({
            name: month,
			color: '#18bc9c',
			type: $scope.showLine ? 'spline' : 'bar',
            data: days
        });
	}
	
})

.controller('metaController', function($scope, $http) {
	$scope.meta = null;
	$scope.partialUrl = null;
	
	$http.get('/admin/meta')
	.success(function(data, status) {
		$scope.metas = data.meta;
		
		if (!$scope.$$phase) {
			$scope.$digest();
		}
	})
	
	$scope.showMeta = function (meta) {
		window.location = '/admin/meta/'+meta._id
	}
})