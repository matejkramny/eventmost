
$(document).ready(function() {
  $('input#dontallow').click(function() {
    if ($(this).is(':checked')) {
      $().val('').attr('disabled', true);
    } else {
      $().attr('disabled', false);      
    }
  });
});







$(document).ready(function() {
  $('input#dontallow').click(function() {
    if ($(this).is(':checked')) {
        $(".disabled-image").css( "display", "inline" );
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







