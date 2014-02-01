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
	$scope.paymentRequired = false;
	$scope.promotionalCode = "";
	$scope.promotionalCodeDiscountPercentage = "";
	$scope.promotionalCodeDiscountPrice = "";
	
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
				
				var min = t.min_per_order;
				var max = t.max_per_order;
				if (isNaN(min) || min < 0) {
					min = 0;
				}
				if (isNaN(max) || max < min) {
					max = 0;
				}
				
				t.wantedQuantity = min;
				
				var em_fee = t.price * 0.024 + 0.2
				t.priceWithFee = em_fee;
				t.priceWithFeeFormatted = t.priceWithFee.toFixed(2);
				t.priceFormatted = t.price.toFixed(2);
				
				if (t.price == 0) {
					t.priceFormatted = "0.00";
					t.priceWithFeeFormatted = "0.00";
					t.priceWithFee = 0;
				}
				
				t.expired = true;
				if (t.hasSaleDates) {
					var start = new Date(t.start);
					var end = new Date(t.end);
					var now = new Date();
					
					if (now.getTime() > start.getTime() && now.getTime() < end.getTime() && t.quantity > 0) {
						t.expired = false;
					}
					t.start_formatted = moment(t.start).format('DD MMM YYYY')
					t.end_formatted = moment(t.end).format('DD MMM YYYY')
				} else {
					t.start_formatted = 'n/a';
					t.end_formatted = 'n/a';
					
					if (t.quantity > 0) {
						t.expired = false;
					}
				}
				
				if (t.expired) {
					t.wantedQuantity = 0;
				}
			}
			
			$scope.tickets = data.tickets;
			
			$scope.updateTotal()
		})
	}
	
	$scope.showPayment = function () {
		if ($scope.totalQuantity == 0) return;
		
		if ($scope.totalPrice == 0) {
			$scope.status = "Processing Request..."
			// Free tickets..
			$scope.showPaymentMethods = false;
			$scope.hideRegister = true;
			
			var tickets = $scope.getTickets();
			
			var data = {
				_csrf: $scope.csrf,
				tickets: tickets,
				promotionalCode: ''
			};
			if ($scope.promo && $scope.promo.applicable) {
				data.promotionalCode = $scope.promo.code;
			}
			
			$http.post($scope.url+'buy/tickets', data).success(function(data, status) {
				if (data.status == 200) {
					$scope.status = "success";
				} else {
					$scope.hideRegister = false;
					$scope.status = data.message;
				}
			}).error(function(data, status) {
				$scope.hideRegister = false;
				$scope.status = "The Request has Failed. Please try again later."
			})
			
			return;
		}
		
		$scope.showPaymentMethods = true;
		$scope.hideRegister = true;
	}
	
	$scope.updateTotal = function () {
		var total = 0;
		var total_nofees = 0;
		var total_fees = 0;
		var quantity = 0;
		for (var i = 0; i < $scope.tickets.length; i++) {
			var t = $scope.tickets[i];
			
			var min = t.min_per_order;
			var max = t.max_per_order;
			if (isNaN(min) || min < 0) {
				min = 0;
			}
			if (isNaN(max) || max < min) {
				max = 0;
			}
			
			if (t.wantedQuantity > t.quantity) {
				t.wantedQuantity = t.quantity;
			}
			if (t.wantedQuantity < min) {
				t.wantedQuantity = min;
			} else if (max != 0 && t.wantedQuantity > max) {
				t.wantedQuantity = max;
			}
			
			if (t.wantedQuantity <= 0 || isNaN(t.wantedQuantity)) continue;
			
			var wantedQuantity = t.wantedQuantity;
			var em_fee = t.price * 0.024 + 0.2;
			var price = t.price + em_fee;
			if (t.price == 0) {
				price = 0;
				em_fee = 0;
			}
			
			if ($scope.promo && $scope.promo.applicable && $scope.promo.ticket._id == t._id && wantedQuantity > 0) {
				// There's a discount for this ticket.
				wantedQuantity -= 1;
				
				var newPrice = t.price - $scope.promo.price;
				var __em_fee = newPrice * 0.024 + 0.2;
				if (newPrice == 0) {
					__em_fee = 0;
				}
				
				total += newPrice + __em_fee;
				total_nofees += newPrice;
				total_fees += __em_fee;
				quantity += 1;
			}
			
			total += wantedQuantity * price;
			total_nofees += wantedQuantity * t.price;
			total_fees += wantedQuantity * em_fee;
			quantity += wantedQuantity;
		}
		
		if (quantity == 0) {
			$scope.totalPrice = 0;
			$scope.totalQuantity = 0;
			$scope.totalPriceFormatted = "0.00";
			$scope.ticketPriceFormatted = "0.00";
			$scope.feePriceFormatted = "0.00";
			return;
		}
		
		if (total != 0) {
			total = (total+0.2) / (1 - 0.025);
		}
		
		$scope.ticketPriceFormatted = total_nofees.toFixed(2);
		$scope.feePriceFormatted = total_fees.toFixed(2)
		$scope.totalPrice = total;
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
			
			var data = {
				_csrf: $scope.csrf,
				tickets: tickets,
				payment_id: response.id,
				promotionalCode: ""
			};
			if ($scope.promo && $scope.promo.applicable) {
				data.promotionalCode = $scope.promo.code;
			}
			
			$http.post($scope.url+'buy/tickets', data).success(function(data, status) {
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
	
	$scope.applyCode = function (code) {
		$scope.promo = {
			applicable: false,
			src: {},
			code: "",
			percentage: 0,
			percentageFormatted: "Looking up...",
			ticket: null,
			price: 0,
			priceFormatted: ""
		}
		
		$http.get($scope.url+'buy/tickets/getPromotionalCode/'+code).success(function(data, status) {
			if (data.status == 200) {
				var tid = data.ticket;
				var ticket = null;
				
				for (var i = 0; i < $scope.tickets.length; i++) {
					if ($scope.tickets[i]._id == tid) {
						ticket = $scope.tickets[i];
						break;
					}
				}
				
				var price = ticket.price * (data.discount / 100);
				
				$scope.promo = {
					applicable: true,
					code: code,
					src: data,
					percentage: data.discount,
					percentageFormatted: data.discount+"% Discount",
					ticket: ticket,
					price: price,
					priceFormatted: "£"+price.toFixed(2)
				};
			} else {
				$scope.promo = {
					applicable: false,
					code: "",
					src: data,
					percentage: 0,
					percentageFormatted: "Code Not Found",
					ticket: null,
					price: 0,
					priceFormatted: ""
				}
			}
			
			$scope.updateTotal()
			
			if (!$scope.$$phase) {
				$scope.$digest();
			}
		})
	}
})