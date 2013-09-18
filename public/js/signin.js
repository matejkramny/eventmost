$(document).ready(function() {
	$loginForm = $("#LoginForm")
	$loginUserEmail = $("#LoginUserEmail")
	$loginUserPassword = $("#LoginUserPassword")
	
	$registerForm = $("#RegisterForm")
	$registerUserName = $("#RegisterUserName")
	$registerUserEmail = $("#RegisterUserEmail")
	$registerUserPassword = $("#RegisterUserPassword")
	
	new Form($loginForm, { "email": $loginUserEmail, "password": $loginUserPassword }, {
		
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
				url: options.url,
				method: "POST",
				data: self.buildData(),
				success: self.options.success,
				failure: self.options.failure
			});
			
			return false;
		})
	}
})