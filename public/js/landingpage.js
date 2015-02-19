var counter = 1;
$(document).ready(function(){

	setTimeout(function() {
    	$("#videoContainer")[0].pause();
    	showText();
    	//showForm();

    }, 3000);
	//alert("im ready");
});


function showText(){
	$( "#textbanner" ).fadeIn( 3000, function() {
		
      	image_animate();
      	
    	/*$('html, body').animate({
		    scrollTop: $("#videoContainer").offset().top
		}, 2000);*/
  	});
}

function image_animate() {
	
	if(counter == 1) {
		console.log("first log moving");
		$('#plane').show();

		setTimeout(function() {
			$('#plane').animate({left: -400, top: 200}, 7000, 'swing', function(){
				$('#plane2').show();
				counter++;
				image_animate();
			});
		}, 4000);
	}
	if(counter == 2) {
		console.log("second log moving");
		setTimeout(function(){
			$('#plane2').animate({top: 200}, 7000, 'swing', function(){
				$('#plane3').show();
				counter++;
				image_animate();
			});
		}, 4000);
	}
	if(counter == 3) {
		console.log("third log moving");
		setTimeout(function(){
			$('#plane3').animate({right: -400, top: 200}, 7000, 'swing', function(){
				counter++;
				showForm();
			});
		}, 4000);
	}
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
				}, 500);

		    }, 3000);
		});

  	});
}