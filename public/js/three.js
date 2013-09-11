$(document).ready(function() {
	// Dropdown toggles
	$(".dropdown dt a").click(function() {
		$(this).parent().parent().find("dd ul").toggle();
	});
	
	$(".dropdown dd ul li a").click(function() {
		var text = $(this).html();
		$(this).parent().parent().parent().find("dt a").html(text);
		$(this).parent().parent().hide();
	});
	
	$(document).bind('click', function(e) {
		var $clicked = $(e.target);
		if (! $clicked.parents().hasClass("dropdown")) {
			$(".dropdown dd ul").hide();
		}
	});
});