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
		
		if (isEmail) {
			$("#sendInboxForm input[name=field], #takeoverForm input[name=field]").val(text);
			$('#afterSelectingProfile').removeClass('hide')
		}
		
		return false;
	})
	
	$('#sendInbox, #takeoverProfile').click(function(ev) {
		ev.preventDefault()
		
		$(this).parent().submit();
		
		return false;
	})
})