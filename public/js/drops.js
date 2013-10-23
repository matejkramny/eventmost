$(document).ready(function() {
	$("body").on('click', "a[href='#']", function(e) {
		// prevents the page from scrolling up
		e.preventDefault();
		return false;
	})
	
	// Dropdown toggles
	$(".dropdown2 dt a, .dropdown3 dt a, .dropdown4 dt a, .dropdown5 dt a, .dropdown6 dt a, .dropdown7 dt a, .dropdown8 dt a, .dropdown12 dt a, .dropdown-color-red dt a, .dropdown-color-orange dt a, .dropdown-color-blue dt a").click(function() {
		$(this).parent().parent().find("dd ul").toggle();
	});
	
	$(".dropdown2 dd ul li a, .dropdown3 dd ul li a, .dropdown4 dd ul li a, .dropdown5 dd ul li a, .dropdown6 dd ul li a, .dropdown12 dd ul li a, .dropdown-color-red dd ul li a, .dropdown-color-orange dd ul li a, .dropdown-color-blue dd ul li a").click(function() {
		var text = $(this).html();
		$(this).parentsUntil('.dropdown2,.dropdown3,.dropdown4,.dropdown5,.dropdown6,.dropdown12,.dropdown-color-red,.dropdown-color-orange,.dropdown-color-blue').parent().find("dt a").html(text);
		$(this).parentsUntil('ul').parent().hide();
	});
	
	$(document).bind('click', function(e) {
		var $clicked = $(e.target);
		if (! $clicked.parent().hasClass("dropdown")) {
			$(".dropdown2 dd ul, .dropdown3 dd ul, .dropdown4 dd ul, .dropdown5 dd ul, .dropdown6 dd ul, .dropdown7 dd ul, .dropdown8 dd ul, .dropdown12 dd ul, .dropdown-color-red dd ul, .dropdown-color-orange dd ul, .dropdown-color-blue dd ul").hide();
		}
	});
