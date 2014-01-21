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
	$scope.ticketPriceFormatted = "0.00";
	$scope.feePriceFormatted = "0.00";
	$scope.showPaymentMethods = false;
	$scope.status = '';
	$scope.card = {
		name: '',
		number: '',
		expiry: '',
		cvc: '',
		errors: {
			name: 'inherit',
			number: 'inherit',
			cvc: 'inherit',
			expiry: 'inherit'
		}
	};
	$scope.stripe_key = '';
	$scope.init_stripe = false;
	$scope.cardFormDisabled = false;
	
	$scope.init = function (opts) {
		$scope.url = "/event/"+opts.id+"/";
		$scope.eventid = opts.id;
		$scope.csrf = opts.csrf;
		$scope.event_date = opts.event_date;
		$scope.stripe_key = opts.stripe_key;
		
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
				var em_fee = t.price * 0.024 + 0.2
				t.priceWithFee = em_fee;
				t.priceWithFeeFormatted = t.priceWithFee.toFixed(2);
				t.priceFormatted = t.price.toFixed(2);
				
				t.expired = true;
				var start = new Date(t.start);
				var end = new Date(t.end);
				var now = new Date();
				
				if (now.getTime() > start.getTime() && now.getTime() < end.getTime() && t.quantity > 0) {
					t.expired = false;
				}
				t.start_formatted = moment(t.start).format('DD/MM/YYYY HH:mm:ss')
				t.end_formatted = moment(t.end).format('DD/MM/YYYY HH:mm:ss')
			}
			
			$scope.tickets = data.tickets;
		})
	}
	
	$scope.updateTotal = function () {
		var total = 0;
		var total_nofees = 0;
		var total_fees = 0;
		var quantity = 0;
		for (var i = 0; i < $scope.tickets.length; i++) {
			var t = $scope.tickets[i];
			if (t.wantedQuantity == 0 || isNaN(t.wantedQuantity)) continue;
			
			if (t.wantedQuantity > t.quantity) {
				t.wantedQuantity = t.quantity;
			}
			
			var em_fee = t.price * 0.024 + 0.2;
			var price = t.price + em_fee;
			total += t.wantedQuantity * price;
			total_nofees += t.wantedQuantity * t.price;
			total_fees += em_fee * t.wantedQuantity;
			quantity += t.wantedQuantity;
		}
		
		if (quantity == 0) {
			$scope.totalPrice = 0;
			$scope.totalQuantity = 0;
			$scope.totalPriceFormatted = "0.00";
			$scope.ticketPriceFormatted = "0.00";
			$scope.feePriceFormatted = "0.00";
			return;
		}
		
		var total = (total+0.2) / (1 - 0.025);
		$scope.ticketPriceFormatted = total_nofees.toFixed(2);
		$scope.feePriceFormatted = total_fees.toFixed(2)
		$scope.totalPrice = (total+0.2) / (1 - 0.025);
		$scope.totalQuantity = quantity;
		$scope.totalPriceFormatted = $scope.totalPrice.toFixed(2);
	}
	
	$scope.validateCard = function () {
		var valid = true;
		
		if ($scope.card.name.length == 0) {
			$scope.card.errors.name = 'red';
			valid = false;
		} else {
			$scope.card.errors.name = 'inherit'
		}
		
		if (Stripe.card.validateCardNumber($scope.card.number)) {
			$scope.card.errors.number = 'inherit';
		} else {
			$scope.card.errors.number = 'red';
			valid = false;
		}
		
		var expiry = $scope.card.expiry;
		if (expiry.length == 0) {
			valid = false;
			$scope.card.errors.expiry = 'red';
		} else {
			var split = expiry.split('/');
			if (split.length != 2) {
				valid = false
				$scope.card.errors.expiry = 'red';
			} else {
				if (Stripe.card.validateExpiry(split[0], split[1])) {
					$scope.card.errors.expiry = 'inherit';
				} else {
					valid = false
					$scope.card.errors.expiry = 'red';
				}
			}
		}
		
		if ($scope.card.cvc.length != 0 && !Stripe.card.validateCVC($scope.card.cvc)) {
			$scope.card.errors.cvc = 'red';
			valid = false;
		} else {
			$scope.card.errors.cvc = 'inherit'
		}
		
		return valid;
	}
	
	$scope.payWithCard = function () {
		if ($scope.cardFormDisabled) return;
		
		if (typeof Stripe === 'undefined') {
			// Shit, Stripe not loaded :/
			$scope.status = "Libraries failed to load. Please reload the page and try again."
			return;
		}
		
		if ($scope.init_stripe == false) {
			$scope.init_stripe = true;
			Stripe.setPublishableKey($scope.stripe_key);
		}
		
		var tickets = $scope.getTickets()
		
		if (tickets.length == 0) {
			$scope.status = "No Tickets Selected";
			$scope.hideRegister = false;
			return;
		}
		
		if ($scope.validateCard()) {
			$scope.status = "Preparing to pay with Card..."
			$scope.cardFormDisabled = true;
			
			var expiry = $scope.card.expiry;
			var split = expiry.split('/');
			
			Stripe.card.createToken({
				number: $scope.card.number,
				cvc: $scope.card.cvc,
				exp_month: split[0],
				exp_year: split[1],
				name: $scope.card.name
			}, $scope.cardResponse);
		}
	}
	
	$scope.cardResponse = function (status, response) {
		console.log(status);
		console.log(response);
		
		if (response.error) {
			$scope.status = response.error.message;
			$scope.cardFormDisabled = false;
		} else {
			var tickets = $scope.getTickets()
			
			$scope.status = "Performing Payment...";
			$scope.card.number = "XXXX XXXX XXXX "+response.card.last4
			if ($scope.card.cvc.length > 0) {
				$scope.card.cvc = "XXX"
			}
			$scope.card.expiry = "XX/XXXX";
			
			$http.post($scope.url+'buy/tickets', {
				_csrf: $scope.csrf,
				tickets: tickets,
				payment_id: response.id
			}).success(function(data, status) {
				if (data.status == 200) {
					$scope.status = "success";
				} else {
					$scope.status = data.message;
					$scope.cardFormDisabled = false;
				}
			}).error(function(data, status) {
				$scope.cardFormDisabled = false;
				$scope.status = "The Request has Failed. Please try again later."
			})
		}
		
		if (!$scope.$$phase) {
			$scope.$digest();
		}
	}
	
	$scope.getTickets = function () {
		var tickets = [];
		
		// Aggregate tickets
		for (var i = 0; i < $scope.tickets.length; i++) {
			var t = $scope.tickets[i];
			
			if (t.wantedQuantity > 0) {
				tickets.push({
					id: t._id,
					quantity: t.wantedQuantity
				})
			}
		}
		
		return tickets;
	}
	
})