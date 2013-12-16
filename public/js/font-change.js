/*custom.min*/
	
    $(document).ready(function () {

        $(".font-change").each(function () {

            var charLength = $(this).text().length;

            if (charLength >= 20) $(this).css("font-size", "12px");
        });

    });


    $(document).ready(function () {

        $(".font-change2").each(function () {

            var charLength = $(this).text().length;

            if (charLength >= 20) $(this).css("font-size", "16px");
        });

    });