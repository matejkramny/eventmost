$(document).ready(function() {
	// Dropdown toggles
	$(".dropdown dt a").click(function() {
		$(this).parent().parent().find("dd ul").toggle();
	});
	
	$(".dropdown dd ul li a").click(function() {
		var text = $(this).html();
		$(this).parentsUntil('.dropdown').parent().find("dt a").html(text);
		$(this).parentsUntil('ul').parent().hide();
	});
	
	$(document).bind('click', function(e) {
		var $clicked = $(e.target);
		if (! $clicked.parent().hasClass("dropdown")) {
			$(".dropdown dd ul").hide();
		}
	});
});