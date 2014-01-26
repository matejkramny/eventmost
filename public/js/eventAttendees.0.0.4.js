angular.module('eventMost', [])
.controller('eventAttendees', function($scope, $http) {
	$scope.url = "";
	$scope.admin = false;
	$scope.attendees = [];
	$scope.search = "";
	
	$scope.init = function (opts) {
		$scope.url = opts.url;
		$scope.admin = opts.admin;
		$scope.csrf = opts.csrf;
		
		$scope.reload()
	}
	
	$('#attendance-graph').highcharts({
		chart: {
			backgroundColor: 'rgba(255, 255, 255, 0)',
			height: '150'
		},
		title: {
			text: '',
		},
		legend: {
			enabled: false
		},
		plotOptions: {
			pie: {
				allowPointSelect: true,
				cursor: 'pointer',
				dataLabels: {
					enabled: false
				},
				showInLegend: true
			}
		},
		tooltip: {
			pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
		},
		series: [{
			type: 'pie',
			allowPointSelect: true,
			dataLabels: {
				enabled: true
			},
			data: [{
				name: '50% Attending',
				y: 50,
				selected: true,
				sliced: true
			}, {
				name: '50% Not Attending',
				y: 50,
				selected: false,
				sliced: false
			}],
			name: 'Attendance'
		}],
		credits: {
			enabled: false
		}
	});
	
	$scope.searchName = function (attendee) {
		if ($scope.search.length == 0) return true;
		
		if (attendee.user.name.toLowerCase().indexOf($scope.search.toLowerCase()) > -1) {
			return true;
		}
		
		return false;
	}
	
	$scope.reload = function () {
		$http.get($scope.url+"/attendees").success(function(data, status) {
			$scope.attendees = data.attendees;
			for (var i = 0; i < $scope.attendees.length; i++) {
				if (typeof $scope.attendees[i].checkedOff === 'undefined') {
					$scope.attendees[i].checkedOff = false;
				}
			}
			
			$scope.recalculateGraph();
			
			if (!$scope.$$phase) {
				$scope.$digest();
			}
		})
	}
	
	$scope.recalculateGraph = function () {
		var attending = 0;
		for (var i = 0; i < $scope.attendees.length; i++) {
			if ($scope.attendees[i].checkedOff) {
				attending++;
			}
		}
		
		$scope.attendeesCheckedOff = attending;
		var attendees = $scope.attendees.length;
		var notAttending = attendees - attending;
		
		var chart = $('#attendance-graph').highcharts();
		chart.series[0].setData([{
			name: (($scope.attendeesCheckedOff / attendees) * 100).toFixed(1)+'% Attending',
			y: attending / attendees
		}, {
			name: ((notAttending / attendees) * 100).toFixed(1)+'% Not Attending',
			y: notAttending / attendees
		}])
	}
	
	$scope.checkOff = function (attendee) {
		attendee.checkedOff = !attendee.checkedOff;
		
		$scope.recalculateGraph();
		
		$http.put($scope.url+'/attendee/'+attendee._id+'/'+(attendee.checkedOff == false ? 'un' : '')+'register', {
			_csrf: $scope.csrf
		})
	}
})
