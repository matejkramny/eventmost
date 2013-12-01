$(document).ready(function() {
	var text;
	$("#takeoverEmail input[type=button], #takeoverUser input[type=button]").click(function(ev) {
		ev.preventDefault();
		
		var isEmail = false;
		var $form = $(this).parent()
		var id = $form.attr('id')
		if (id == 'takeoverEmail') {
			isEmail = true;
			text = $form.find('input[type=email]')
		} else {
			text = $form.find('input[type=search]')
		}
		text = text.val();
		
		$('#afterSelectingProfile').removeClass('hide')
		
		return false;
	})
	
	$('#sendInbox').click(function() {
		window.location = 'sendInbox/'+text;
	})
	$('#takeoverProfile').click(function() {
		window.location = 'takeover/'+text;
	})
})