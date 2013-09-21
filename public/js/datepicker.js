// DOM Ready
$(document).ready(function() {
	function onselect(date, $this) {
		var dateString = date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear();
		$($this).parent().find(".datepickerResult").html(dateString);
	}
	
	$('#datepicker, #datepicker2').each(function() {
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
				onselect(date, $(this));
			}
		});
		var date = $(this).datepicker('getDate');
		onselect(date, $(this));
	});
});