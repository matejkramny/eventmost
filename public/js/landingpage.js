var counter = 1;
$(document).ready(function(){
	$('#header').hide();
	showText();

	setTimeout(function() {
    	$("#videoContainer")[0].pause();
    }, 3000);
});

function moveuptillvideo(){
	$('html, body').animate({
	    scrollTop: $("#videoContainer").offset().top
	}, 500);
}

function showText(){
	//$('#videoContainer')[0].scrollIntoView(true);
	$( "#textbanner" ).fadeIn( 6000, function() {
		
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
			$('#plane').animate({left: -400, top: 200}, 500, 'swing', function(){
				$('#plane2').show();
				counter++;
				image_animate();
			});
		}, 4000);
	}
	if(counter == 2) {
		console.log("second log moving");
		setTimeout(function(){
			$('#plane2').animate({top: 200}, 500, 'swing', function(){
				$('#plane3').show();
				counter++;
				image_animate();
			});
		}, 4000);
	}
	if(counter == 3) {
		console.log("third log moving");
		setTimeout(function(){
			$('#plane3').animate({right: -400, top: 200}, 500, 'swing', function(){
				counter++;
				showForm();
			});
		}, 4000);
		
	}
}

function moveUp(){
	$('#plane').animate({top: 50}, 1000, 'swing', function(){
		
	});
	$('#plane2').animate({top: 50}, 1000, 'swing', function(){
			
		});
	$('#plane3').animate({top: 50}, 1000, 'swing', function(){
			});
	$('#eventswrapper').animate({top: -540}, 1000, 'swing', function(){
		$('#header').show();
			});
	
	
}

function showForm(){
	$( "#textbanner" ).fadeOut( 200, function() {
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
		  $(this).delay(i*20).fadeIn(20);
		});

		$( "#searchbanner" ).fadeIn( 3000, function() {
			moveUp();
			setTimeout(function() {
				
				$('#header').css({"float": "left",
							    "height": "85px",
							    "position": "absolute",
							    "width": "100%",
							    "z-index": "99999"});
				$('#textbanner2').css({"top": "90px"});
				$('#searchbanner').css({"top": "150px"});
		    	

		    }, 1000);
		});

  	});
  	
}