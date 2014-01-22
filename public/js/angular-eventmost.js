var eventMost = angular.module('eventMost', [])

/* Font-Change */
 $(document).ready(function () {
     $(".font-change").each(function () {
         var charLength = $(this).text().length;
			
         if (charLength >= 20) $(this).css("font-size", "12px");
     });
	  
     $(".font-change2").each(function () {
         var charLength = $(this).text().length;
			
         if (charLength >= 20) $(this).css("font-size", "16px");
     });
 });