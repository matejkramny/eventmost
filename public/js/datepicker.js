// DOM Ready
$(document).ready(function() {
	function onselect(date, $this, $timePicker) {
		var dateString = date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear() + " " + $timePicker.val();
		$($this).parent().find(".datepickerResult").html(dateString);
	}
	
	$('#datepicker, #datepicker2').each(function() {
		var self = this;
		$(this).datepicker({
			inline: true,
			//nextText: '&rarr;',
			//prevText: '&larr;',
			showOtherMonths: true,
			//dateFormat: 'dd MM yy',
			dayNamesMin: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
			//showOn: "button",
			//buttonImage: "img/calendar-blue.png",
			//buttonImageOnly: true,
			onSelect: function() {
				var date = $(this).datepicker('getDate');
				onselect(date, $(this), $(this).parent().find("input[type=time]"));
			}
		});
		var date = $(this).datepicker('getDate');
		onselect(date, $(this), $(this).parent().find("input[type=time]"));
		
		$(this).parent().find("input[type=time]").change(function() {
			onselect($(self).datepicker('getDate'), $(self), $(this));
		});
	});
});