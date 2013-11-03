/*custom.min*/
	
jQuery(document).ready(function($){
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
