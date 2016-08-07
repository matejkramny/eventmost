$('.dropdownoptions').click(function(e){
	e.stopPropagation();
})

/*
For stopping dropdown hide completely.

$('.dropdown').on('hide.bs.dropdown', function () {
	return false;
});

*/


angular.module('eventMost')
.controller('dropboxSharingController', function($scope, $http, $filter) {
	$scope.file = null;
	$scope.categories = [];
	$scope.showNobody = false;
	
	$scope.setFile = function (file) {
		$scope.file = file;
	}
	
	$scope.setCategories = function (categories) {
		var cats = [];
		for (var i = 0; i < categories.length; i++) {
			var found = false;
			
			for (var x = 0; x < $scope.file.permissions.categories.length; x++) {
				if ($scope.file.permissions.categories[x] == categories[i]) {
					found = true;
					break;
				}
			}
			
			cats.push({
				name: categories[i],
				checked: found
			})
		}
		
		$scope.categories = cats;
	}
	
	$scope.toggleAll = function () {
		if ($scope.file.permissions.all) {
			$scope.file.permissions.categories = [];
			for (var i = 0; i < $scope.categories.length; i++) {
				$scope.categories[i].checked = false;
			}
			$scope.showNobody = false;
		} else {
			if ($scope.file.permissions.categories.length == 0) {
				$scope.showNobody = true;
			} else {
				$scope.showNobody = false;
			}
		}
	}
	
	$scope.updateCategories = function () {
		$scope.file.permissions.categories = $filter('filter')($scope.categories, { checked: true });
		var cats = [];
		for (var x = 0; x < $scope.file.permissions.categories.length; x++) {
			cats.push($scope.file.permissions.categories[x].name);
		}
		
		if (cats.length == $scope.categories.length) {
			$scope.file.permissions.all = true;
			$scope.file.permissions.categories = [];
			for (var i = 0; i < $scope.categories.length; i++) {
				$scope.categories[i].checked = false;
			}
			$scope.showNobody = false;
		} else if (cats.length > 0) {
			$scope.file.permissions.all = false;
			$scope.showNobody = false;
		} else if (cats.length == 0) {
			$scope.showNobody = true;
		}
		
		$scope.file.permissions.categories = cats;
	}
	
	$scope.req = null;
	$scope.save = function () {
		var form = new FormData();
		form.append("_csrf", $("head meta[name=_csrf]").attr('content'));
		form.append("permissions", JSON.stringify($scope.file.permissions));
		form.append("file", $scope.file._id)
		
		$scope.req = new XMLHttpRequest();
		$scope.req.open("POST", "/event/"+$("head meta[name=event_id]").attr('content')+"/dropbox", true);
		try {
			$scope.req.responseType = "json";
		} catch (e) {
			$scope.parseAsJson = true;
		}
		$scope.req.setRequestHeader("accept", "application/json");
		$scope.req.onreadystatechange = $scope.afterSave;
		$scope.req.send(form);
	}
	
	$scope.parseAsJson = false;
	$scope.afterSave = function () {
		if ($scope.req.readyState == 4) {
			if ($scope.req.status == 200) {
				result = $scope.req.response;
				if ($scope.parseAsJson) {
					result = JSON.parse($scope.req.responseText);
				}
				
				if (result.status != 200) {
					alert("Could not save dropbox :(\n"+result.err);
				} else {
					window.location.reload();
				}
			} else {
				// Not ok
				alert(req.statusText);
			}
		}
	}
})
.directive('dropboxSave', function() {
	return {
		restrict: 'A',
		link: function(scope, element) {
			$(element).bind('click', scope.save)
		}
	}
})