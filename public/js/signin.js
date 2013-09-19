$(document).ready(function() {
	$loginForm = $("#LoginForm")
	$loginUserEmail = $("#LoginUserEmail")
	$loginUserPassword = $("#LoginUserPassword")
	
	$registerForm = $("#RegisterForm")
	$registerUserName = $("#RegisterUserName")
	$registerUserEmail = $("#RegisterUserEmail")
	$registerUserPassword = $("#RegisterUserPassword")
	
	$registerUserEmail.blur(function() {
		// Check email availability
		var $status = $registerForm.find('.formStatus');
		
		if ($registerUserEmail.val().length == 0) {
			return;
		}
		
		$status.html("Checking email address availability..");
		
		$.ajax({
			url: "/emailavailable",
			data: new Form(null, {"email": $registerUserEmail}).buildData(),
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
	
	$("#openRegisterModal").click(function() {
		$("#loginModal").trigger('reveal:close');
		$("#signModal").reveal();
	})
	
	function Form($form, $elements, options) {
		this.form = $form;
		this.elements = $elements;
		this.options = options;
		this.url = "/auth/password.json"
		
		var self = this;
		
		this.success = function(data, status, jqxhr) {
			if (data == null) {
				// error
				self.status.html("Server error - Please try again later. Sorry")
				return;
			}
			
			if (data.status == 200 && data.user != null) {
				// Logged in
				self.status.html("Logged in, reloading page.");
				window.location = "/";
			} else {
				// Error
				self.status.html(data.err)
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
	
	new Form($loginForm, {
		"login": $loginUserEmail,
		"password": $loginUserPassword
	}, {});
	new Form($registerForm, {
		"name": $registerUserName,
		"login": $registerUserEmail,
		"password": $registerUserPassword
	}, {});
})