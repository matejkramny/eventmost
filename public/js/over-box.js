/*custom.min*/
	
$(document).ready(function(){
	$('#slider1').tinycarousel();
	//portfolio - show link
	$('.slid-box-background').hover(
		function () {
			$(this).css({ opacity:'1' });
		},
		function () {
			$(this).css({ opacity:'0' });
		}
	);	
});
