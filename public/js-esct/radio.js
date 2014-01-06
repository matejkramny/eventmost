$(function() {
$('input:radio').each(function() {
    $(this).hide();
    $('<a class="radio-fx" href="#"><div class="radio"></div></a>').insertAfter(this);
});
$('.radio-fx').on('click',function(e) {
    e.preventDefault();
      var $check = $(this).prev('input');
      $('.radio-fx div').attr('class','radio');
      $(this).find('div').attr('class','radio-checked');          
      $check.attr('checked', true);
});
});