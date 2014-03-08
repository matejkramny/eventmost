$(document).ready(function() {
	$loginForm = $("#LoginForm")
	$loginUserEmail = $("#LoginUserEmail")
	$loginUserPassword = $("#LoginUserPassword")
	$UserLoginForm = $("#UserLoginForm")
	
	$registerForm = $("#RegisterForm")
	$registerUserName = $("#RegisterUserName")
	$registerUserEmail = $("#RegisterUserEmail")
	$registerUserPassword = $("#RegisterUserPassword")
	
	var redirect = "/auth/success";
	
	$('.enable_popover').popover()
	
	$registerUserEmail.blur(function() {
		// Check email availability
		var $status = $registerForm.find('.formStatus');
		
		if ($registerUserEmail.val().length == 0) {
			return;
		}
		
		$status.html("Checking email address availability..");
		
		$.ajax({
			url: "/emailavailable",
			data: new Form(null, {"email": $registerUserEmail}, {}).buildData(),
			dataType: 'json',
			type: "POST",
			success: function(data) {
				if (data.available == true) {
					$status.html("Email is available.");
				} else {
					$status.html("Sorry, email is already taken.")
				}
			},
			error: function(jqxhr, status, error) {
				$status.html("Sorry, we can't complete the request at this time.")
			}
		});
	});
	
	$(".openRegisterModal").click(function() {
		$("#loginModal").modal('hide');
		$("#signModal").modal('show');
	})
	$(".openLoginModal").click(function() {
		$("#signModal").modal('hide');
		$("#loginModal").modal('show');
	})
	$(".openForgotModal").click(function() {
		$("#loginModal").modal('hide');
		$("#forgotModal").modal('show')
	})
	
	$('.openEvent').click(function() {
		redirect = '/event/'+$(this).attr('data-event')+"/registrationpage?redirect=1";
		$('#signModal').modal('show');
	})
	
	function Form($form, $elements, options) {
		this.form = $form;
		this.elements = $elements;
		this.options = options;
		this.url = options.url ? options.url : "/auth/password"
		
		var self = this;
		
		this.success = function(data, status, jqxhr) {
			self.status.removeClass("hide");
			
			if (data == null) {
				// error
				self.status.html("Server error - Please try again later. Sorry")
				return;
			}
			
			if (data.status == 200 && data.user != null) {
				// Logged in
				self.status.html("Logged in, reloading page!");
				window.location = redirect;
			} else {
				// Error
				self.status.html(data.err.join("<br/>"))
			}
		}
		this.error = function(jqxhr, status, error) {
			alert(error);
		}
		
		this.buildData = function() {
			var d = "";
			
			for (key in self.elements) {
				d += key + "=" + encodeURIComponent(self.elements[key].val()) + "&"
			}
			
			d += "_csrf=" + encodeURIComponent($("head meta[name=_csrf]").attr('content'));
			
			return d;
		}
		
		if ($form) {
			this.status = $form.find(".formStatus");
		
			this.form.submit(function(event) {
				event.preventDefault();
				
				self.status.removeClass("hide");
				self.status.html("Sending Request..")
				
				// Perform AJAX whatever
				$.ajax({
					url: self.url,
					type: "POST",
					dataType: 'json',
					data: self.buildData(),
					success: self.success,
					error: self.error
				});
			
				if (typeof self.elements["password"] !== "undefined") {
					self.elements["password"].val("")
				}
			
				return false;
			})
		}
	}
	
	var loginForm = new Form($loginForm, {
		"login": $loginUserEmail,
		"password": $loginUserPassword
	}, {});
	var registerForm = new Form($registerForm, {
		"name": $registerUserName,
		"login": $registerUserEmail,
		"password": $registerUserPassword
	}, {});
	var forgotForm = new Form($("#ForgotForm"), {
		"email": $("#ForgotEmail")
	}, {
		url: "/auth/password_reset"
	})
	
	if (window.location.hash) {
		var hash = window.location.hash.substring(1);
	
		if (hash == "login-failed") {
			$("#loginModal").modal('show')
			
			var reason = decodeURIComponent((new RegExp('[?|&]' + "fail-reason" + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
			if (reason) {
				loginForm.status.html(reason)
			}
		}
	}
})