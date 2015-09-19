function sendFeedback(){

	var replymessage = $('#inputMessage').val();
	if(replymessage != ''){
		$.ajax({
	  		method: "POST",
	  		url: "/reply-feedback",
	  		data: { 
	  			feedback_profile_id: $('#feedback_profile_id').val(), 
	  			message: $('#inputMessage').val(),
	  			user_id: $('#user_id').val()  
	  		},
	  		beforeSend: function() {
	  			$('#error').hide();
			    $('#loading').show();
			}
		})
		.done(function( msg ) {
			if(msg.status == 200){
				$('#loading').hide();
				$('#questionbox').hide();
				$('#thankyou').show();
			}
	  	});
	}else{
		$('#error').show();
	}
	
}