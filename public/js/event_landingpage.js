angular.module('eventMost')
.controller('PaymentController', function($scope, $http) {
	$scope.url = "";
	$scope.eventid = "";
	$scope.user = null;
	$scope.csrf = "";
	$scope.tickets = [];
	$scope.totalQuantity = 0;
	$scope.totalPrice = 0;
	$scope.totalPriceFormatted = "0.00";
	$scope.showPaymentMethods = false;
	$scope.status = '';
	
	$scope.init = function (opts) {
		$scope.url = "/event/"+opts.id+"/";
		$scope.eventid = opts.id;
		$scope.csrf = opts.csrf;
		$scope.event_date = opts.event_date;
		
		$scope.reload()
	}
	
	$scope.getArray = function (num) {
		return new Array(num);
	}
	
	$scope.reload = function () {
		$http.get($scope.url+'tickets').success(function(data, status) {
			var tickets = data.tickets;
			
			for (var i = 0; i < tickets.length; i++) {
				var t = tickets[i];
				t.priceWithFee = (t.price * 0.0025) + 0.2;
				t.priceWithFeeFormatted = t.priceWithFee.toFixed(2);
				t.priceFormatted = t.price.toFixed(2);
			}
			
			$scope.tickets = data.tickets;
		})
	}
	
	$scope.updateTotal = function () {
		var total = 0;
		var quantity = 0;
		for (var i = 0; i < $scope.tickets.length; i++) {
			var t = $scope.tickets[i];
			
			total += t.wantedQuantity * t.price;
			quantity += t.wantedQuantity;
		}
		
		$scope.totalPrice = total * 1.0025 + 0.2;
		$scope.totalQuantity = quantity;
		$scope.totalPriceFormatted = $scope.totalPrice.toFixed(2);
	}
	
	$scope.payWithPaypal = function () {
		$scope.status = 'Preparing to pay with Paypal...';
		$scope.showPaymentMethods = false;
		
		$http.post($scope.url + 'buy/tickets/paypal', {
			_csrf: $scope.csrf
		}).success(function(data, status) {
			window.location = data.redirect;
		})
	}
})