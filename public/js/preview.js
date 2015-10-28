function isValidEmailAddress(emailAddress) {
    var pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
    return pattern.test(emailAddress);
}

function sendFeedback(){
	$('#error').hide();
	var email = $('#email').val();
	//console.log(isValidEmailAddress(email));
	if(isValidEmailAddress(email) && email != ''){
		
		$.ajax({
	  		method: "POST",
	  		url: "/messages/feedback/sendFeedback",
	  		data: { 
	  			email:email
	  		},
	  		beforeSend: function() {
	  			$('#emaildiv').hide();
			    $('#loading').show();
			}
		})
		.done(function( msg ) {
			if(msg.status == 200){
				$('#loading').hide();
				$('#emaildiv').hide();
				$('#success').show();
			}else{
				$('#loading').hide();
				$('#emaildiv').hide();
				$('#error').html('Sorry! This newsletter can not be sent!');
				$('#error').show();
			}
	  	});

		
	}else{
		$('#error').show();
	}
	
}