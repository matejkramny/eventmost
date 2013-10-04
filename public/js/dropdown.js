$(document).ready(function() {
	$("body").on('click', "a[href='#']", function(e) {
		// prevents the page from scrolling up
		e.preventDefault();
		return false;
	})
	
	// Dropdown toggles
	$(".dropdown-color-red dt a").click(function() {
		$(this).parent().parent().find("dd ul").toggle();
	});
	
	$(".dropdown-color-red dd ul li a").click(function() {
		var text = $(this).html();
		$(this).parentsUntil('.dropdown-color-red').parent().find("dt a").html(text);
		$(this).parentsUntil('ul').parent().hide();
	});
	
	$(document).bind('click', function(e) {
		var $clicked = $(e.target);
		if (! $clicked.parent().hasClass("dropdown")) {
			$(".dropdown-color-red dd ul").hide();
		}
	});
	
	