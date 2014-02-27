$(document).ready(function(){
        $("#open").click(function(){
            if ($("#slidenav").is(':hidden'))
                $("#slidenav").show().animate({
                top: '257'
            }, 500);
        
            else{
                $("#slidenav").hide().animate({
                top: '0'
            }, 500);
            }
            return false;
        });

        $('#slidenav').click(function(e) {
            e.stopPropagation();
        });
        $(document).click(function() {
            $('#slidenav').hide().animate({
                top: '0'
            }, 500);
        });
    });
