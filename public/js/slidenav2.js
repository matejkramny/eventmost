$(document).ready(function(){
        $("#open2").click(function(){
            if ($("#slidenav2").is(':hidden'))
                $("#slidenav2").show().animate({
                top: '905'
            }, 500);
        
            else{
                $("#slidenav2").hide().animate({
                top: '860'
            }, 500);
            }
            return false;
        });

        $('#slidenav2').click(function(e) {
            e.stopPropagation();
        });
        $(document).click(function() {
            $('#slidenav2').hide().animate({
                top: '860'
            }, 500);
        });
    });
