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


$(document).ready(function() {
	// Dropdown toggles
	$(".dropdown2 dt a").click(function() {
		$(this).parent().parent().find("dd ul").toggle();
	});
	
	$(".dropdown2 dd ul li a").click(function() {
		var text = $(this).html();
		$(this).parent().parent().parent().find("dt a").html(text);
		$(this).parent().parent().hide();
	});
	
	$(document).bind('click', function(e) {
		var $clicked = $(e.target);
		if (! $clicked.parents().hasClass("dropdown2")) {
			$(".dropdown2 dd ul").hide();
		}
	});
});


$(document).ready(function() {
	// Dropdown toggles
	$(".dropdown3 dt a").click(function() {
		$(this).parent().parent().find("dd ul").toggle();
	});
	
	$(".dropdown3 dd ul li a").click(function() {
		var text = $(this).html();
		$(this).parent().parent().parent().find("dt a").html(text);
		$(this).parent().parent().hide();
	});
	
	$(document).bind('click', function(e) {
		var $clicked = $(e.target);
		if (! $clicked.parents().hasClass("dropdown3")) {
			$(".dropdown3 dd ul").hide();
		}
	});
});