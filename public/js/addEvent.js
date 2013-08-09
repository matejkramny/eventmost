$(document).ready(function() {
	$steps = {
		s1 : {
			step: $("#step1"),
			link: $("#step1Link")
		},
		s2 : {
			step: $("#step2"),
			link: $("#step2Link")
		},
		s3 : {
			step: $("#step3"),
			link: $("#step3Link")
		},
		s4 : {
			step: $("#step4"),
			link: $("#step4Link")
		},
		s5 : {
			step: $("#step5"),
			link: $("#step5Link")
		},
		s6 : {
			step: $("#step6"),
			link: $("#step6Link")
		},
		s7 : {
			step: $("#step7"),
			link: $("#step7Link")
		}
	};
	
	function openStep($step) {
		$step.step.animate({ opacity: 1 }, 'fast', function() {
			$step.step.removeClass('stepClosed');
		});
	}
	function closeStep($step) {
		$step.step.animate({ opacity: 0 }, 'fast', function() {
			$step.step.addClass('stepClosed');
		});
	}
	function isClosed($step) {
		return $step.step.hasClass('stepClosed');
	}
	
	function handleClick($src, cb) {
		function handle (ev) {
			ev.preventDefault();
	
			cb();
	
			return false;
		}
		
		$src.click(handle);
		$src.parent().parent().bind('click', handle);
	}
	
	function handleStep($step) {
		handleClick($step.link, function() {
			if (isClosed($step)) {
				openStep($step);
			} else {
				closeStep($step);
			}
		})
	}
	
	for (step in $steps) {
		handleStep($steps[step]);
	}
});