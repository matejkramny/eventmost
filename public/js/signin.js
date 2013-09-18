$(document).ready(function() {
	$loginForm = $("#LoginForm")
	$loginUserEmail = $("#LoginUserEmail")
	$loginUserPassword = $("#LoginUserPassword")
	
	$registerForm = $("#RegisterForm")
	$registerUserName = $("#RegisterUserName")
	$registerUserEmail = $("#RegisterUserEmail")
	$registerUserPassword = $("#RegisterUserPassword")
	
	new Form($loginForm, { "email": $loginUserEmail, "password": $loginUserPassword }, {
		url: "/auth/password",
		success: function(data, status, jqxhr) {
			
		},
		error: function(jqxhr, status, error) {
			
		}
	});
	new Form($registerForm, {
		"name": $registerUserName,
		"email": $registerUserEmail,
		"password": $registerUserPassword
	}, {
		url: "/auth/password",
		success: function(data, status, jqxhr) {
			
		},
		error: function(jqxhr, status, error) {
			
		}
	});
	
	
	function Form($form, $elements, options) {
		this.form = $form;
		this.elements = $elements;
		this.options = options;
		
		var self = this;
		
		this.buildData = function() {
			var d = "?";
			
			for (key in self.elements) {
				d += key + "=" + self.elements[key].val() + "&"
			}
			
			
			return d;
		}
		
		this.form.submit(function(event) {
			event.preventDefault();
			
			// Perform AJAX signin
			$.ajax({
				url: self.options.url,
				type: "POST",
				dataType: 'json',
				data: self.buildData(),
				success: self.options.success,
				error: self.options.error
			});
			
			return false;
		})
	}
})