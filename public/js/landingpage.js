$(document).ready(function(){
	setTimeout(function() {
    	$("#videoContainer")[0].pause();
    	showText();
    	showForm();

    }, 3000);
	//alert("im ready");
});

function showText(){
	$( "#textbanner" ).fadeIn( 3000, function() {
    	$('html, body').animate({
		    scrollTop: $("#videoContainer").offset().top
		}, 2000);
  	});
}

function showForm(){
	$( "#textbanner" ).fadeOut( 3000, function() {
		$( "#textbanner2" ).show();
    	var $el = $("#textbanner2"), text = $el.text(),
		    words = text.split(""), html = "";

		for (var i = 0; i < words.length; i++) {
			var thisletter = words[i];
			if(thisletter == '-'){
				var newLetter = '&nbsp;';
			}else{
				var newLetter = thisletter;
			}
		    html += "<span style='margin: 0px'>" + newLetter + " </span>";
		}

		$el.html(html).children().hide().each(function(i){
		  $(this).delay(i*100).fadeIn(200);
		});

		$( "#searchbanner" ).fadeIn( 3000, function() {
			setTimeout(function() {
		    	$('html, body').animate({
				    scrollTop: $("#arrangeby").offset().top
				}, 5000);

		    }, 3000);
			
		});

  	});
}