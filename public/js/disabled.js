



$(document).ready(function() {
  $('input#dontallow').click(function() {
    if ($(this).is(':checked')) {
        $(".disabled-image").css( "display", "inline" );
        $('input#allow').removeAttr('checked');
    } else {
        $(".disabled-image").css( "display", "none" );    
    }
  });
});

$(document).ready(function() {
  $('input#dontallow').click(function() {
    if ($(this).is(':checked')) {
        $(".diabled-lock").css( "display", "inline" );
    } else {
        $(".diabled-lock").css( "display", "none" );    
    }
  });
});



$(document).ready(function() {
  $('input#allow').click(function() {
    if ($(this).is(':checked')) {
        $(".disabled-image").css( "display", "none" );
        $('input#dontallow').removeAttr('checked');
    } 
  });
});

$(document).ready(function() {
  $('input#allow').click(function() {
    if ($(this).is(':checked')) {
        $(".diabled-lock").css( "display", "none" );
    } 
  });
});







