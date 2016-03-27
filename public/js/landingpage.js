var counter = 1;
$(document).ready(function(){
	//$('#header').show();
	
	
	//--------------  Moving Events Wrapper Up --------------
	var diff = $("#eventswrapper").offset().top - ($("#plane").offset().top + 250);
	if(navigator.platform == "Win32"){
		diff = diff+30;
	}
	//console.log($("#plane").offset().top)
	$('#eventswrapper').css({top: -diff});
	//--------------  Moving Events Wrapper Up --------------

	
	
	/*$('#eventswrapper').animate({top: -diff}, 1, 'swing', function(){
	  //$('#header').show();
	});*/

	/*
	//--------------  Fading Search Text --------------
	var $el = $("#textbanner2"), text = 'Search-events-below-or-create-your-own',
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
	  $(this).delay(i*5).fadeIn('fast');
	});
	//--------------  Fading Search Text --------------
	*/

	/*$('#header').css({"float": "left",
				    "height": "85px",
				    "position": "absolute",
				    "width": "100%",
				    "z-index": "99999"});
	$('#textbanner2').css({"top": "90px"});
	$('#searchbanner').css({"top": "150px"});
	//$( "#textbanner" ).show();
	$('#plane').show();
	$('#plane').css({
		left: -400,
		top: 100
	});
	$('#plane2').show();
	$('#plane2').css({
		top: 100
	});
	$('#plane3').show();
	$('#plane3').css({
		right: -400,
		top: 100
	});

	//$('#textbanner').show();
	$('#textbanner2').show();
	$('#textbanner2').html('<span style="margin: 0px; display: inline;">S </span><span style="margin: 0px; display: inline;">e </span><span style="margin: 0px; display: inline;">a </span><span style="margin: 0px; display: inline;">r </span><span style="margin: 0px; display: inline;">c </span><span style="margin: 0px; display: inline;">h </span><span style="margin: 0px; display: inline;">&nbsp; </span><span style="margin: 0px; display: inline;">e </span><span style="margin: 0px; display: inline;">v </span><span style="margin: 0px; display: inline;">e </span><span style="margin: 0px; display: inline;">n </span><span style="margin: 0px; display: inline;">t </span><span style="margin: 0px; display: inline;">s </span><span style="margin: 0px; display: inline;">&nbsp; </span><span style="margin: 0px; display: inline;">b </span><span style="margin: 0px; display: inline;">e </span><span style="margin: 0px; display: inline;">l </span><span style="margin: 0px; display: inline;">o </span><span style="margin: 0px; display: inline;">w </span><span style="margin: 0px; display: inline;">&nbsp; </span><span style="margin: 0px; display: inline;">o </span><span style="margin: 0px; display: inline;">r </span><span style="margin: 0px; display: inline;">&nbsp; </span><span style="margin: 0px; display: inline;">c </span><span style="margin: 0px; display: inline;">r </span><span style="margin: 0px; display: inline;">e </span><span style="margin: 0px; display: inline;">a </span><span style="margin: 0px; display: inline;">t </span><span style="margin: 0px; display: inline;">e </span><span style="margin: 0px; display: inline;">&nbsp; </span><span style="margin: 0px; display: inline;">y </span><span style="margin: 0px; display: inline;">o </span><span style="margin: 0px; display: inline;">u </span><span style="margin: 0px; display: inline;">r </span><span style="margin: 0px; display: inline;">&nbsp; </span><span style="margin: 0px; display: inline;">o </span><span style="margin: 0px; display: inline;">w </span><span style="margin: 0px; display: inline;">n </span>');
	$('#searchbanner').show();
	var diff = $("#eventswrapper").offset().top - ($("#plane").offset().top + 200);
	if(navigator.platform == "Win32"){
		diff = diff+30;
	}

	console.log($("#plane").offset().top)
	
	
	$('#eventswrapper').animate({top: -diff}, 10, 'swing', function(){
	  $('#header').show();
	});*/
	

	setTimeout(function() {
    	$("#videoContainer")[0].pause();
    }, 12000);

    $("#loadSoonEvents").click(function (){
  		//var soonRes = '<div class="nspacer"></div><div>This is a test</div>';
        //$('#fetchedEvents').html(soonRes);
        $('#successmsg').html('<div style="margin-top:10px"><center><img src="../images/loading.gif" /></center></div>');
        
        $.ajax({
		  method: "GET",
		  url: "/events/loadsoonevents"
		  //data: { name: "John", location: "Boston" }
		}).done(function( msg ) {
			$('#successmsg').html('');
		    $('#fetchedEvents').html(msg);
		  });

  	});

  	$("#loadNearestEvents").click(function (){
  		console.log(window.lastCoords);
  		var coords = window.lastCoords;
  		if(coords === undefined){
  			$('#successmsg').html('<div><center><h3>You must allow general location ability to use this feature.</h3></center></div>');
  		}else{
  			$('#successmsg').html('<div style="margin-top:10px"><center><img src="../images/loading.gif" /></center></div>');
	  		$.ajax({
			  method: "GET",
			  url: "/events/loadnearevents/"+coords.lat+"/"+coords.lng
			  //data: { name: "John", location: "Boston" }
			}).done(function( msg ) {
				if(msg == ''){
					console.log("msg is empty");
					$('#successmsg').html('<div><center><h3>No Event Happening Around You!</h3></center></div>');
					setTimeout(function(){
						$('#successmsg').html('');
					}, '3000');
				}else{
					$('#successmsg').html('');
					$('#fetchedEvents').html(msg);	
				}
			    
			  });
  		}
  	});
});

function moveuptillvideo(){
	$('html, body').animate({
	    scrollTop: $("#videoContainer").offset().top
	}, 10);
}

function image_animate() {
	
	if(counter == 1) {
		console.log("first log moving");
		$('#plane').show();

		setTimeout(function() {
			$('#plane').animate({left: -400, top: 200}, 10, 'swing', function(){
				$('#plane2').show();
				counter++;
				image_animate();
			});
		}, 10);
	}
	if(counter == 2) {
		console.log("second log moving");
		setTimeout(function(){
			$('#plane2').animate({top: 200}, 10, 'swing', function(){
				$('#plane3').show();
				counter++;
				image_animate();
			});
		}, 10);
	}
	if(counter == 3) {
		console.log("third log moving");
		setTimeout(function(){
			$('#plane3').animate({right: -400, top: 200}, 10, 'swing', function(){
				$("#videoContainer")[0].pause();
				counter++;
				showForm();
			});
		}, 10);
		
	}
}

function moveUp(){
	console.log(navigator.platform+"--");
	$('#plane').animate({top: 50}, 10, 'swing', function(){
		
	});
	$('#plane2').animate({top: 50}, 10, 'swing', function(){
			
		});
	$('#plane3').animate({top: 50}, 10, 'swing', function(){
			});
	
	var diff = $("#eventswrapper").offset().top - ($("#plane").offset().top + 100);
	if(navigator.platform == "Win32"){
		diff = diff+30;
	}
	
	
	$('#eventswrapper').animate({top: -diff}, 10, 'swing', function(){
	  $('#header').show();
	});

	/*$('#eventswrapper').animate({top: -540}, 1000, 'swing', function(){
		$('#header').show();
			});*/
	
	
}

function showForm(){
	$( "#textbanner" ).fadeOut( 10, function() {
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
		  $(this).delay(i*5).fadeIn('fast');
		});

		$( "#searchbanner" ).fadeIn( 10, function() {
			moveUp();
			setTimeout(function() {
				
				$('#header').css({"float": "left",
							    "height": "85px",
							    "position": "absolute",
							    "width": "100%",
							    "z-index": "99999"});
				$('#textbanner2').css({"top": "90px"});
				$('#searchbanner').css({"top": "150px"});
		    	

		    }, 10);
		});

  	});


  	
}