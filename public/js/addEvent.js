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
		}
	};
	$lastStep = {
		step: $("#step7"),
		link: $("#step7Link")
	}
	$fields = {
		name: $("#EventName"),
		avatar: $("#EventAvatar"),
		startDate: $("#EventDateStart"),
		endDate: $("#EventDateEnd"),
		description: $("#EventDesc"),
		address: $("#EventAddress"),
		lat: $("#lat"),
		lng: $("#lng"),
		passwordProtected: $("#EventPasswordProtected"),
		password: $("#EventPassword"),
		allowPublicAtt2spk: $("#EventAllowPublicAtt2spk"),
		allowPublicAtt2att: $("#EventAllowPublicAtt2att"),
		filesUpload: $("#EventFilesUpload")
	}
	
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
	
	function nextStep($step, $next, validate) {
		$step.step.find("input.skip").click(function(ev) {
			ev.preventDefault();
			
			closeStep($step);
			openStep($steps.s7)
			
			return false;
		});
		$step.step.find("input.next-step").click(function(ev) {
			ev.preventDefault();
			
			errs = validate($step); // Validate the fields, return array of strings when error, null/false/[] if good
			if (errs == null || errs == false || errs.length == 0) {
				// No errors.
				closeStep($step);
				openStep($next);
				$step.step.find('.errors').html("")
				//$(this).css("display", "none");
			} else {
				// Display errors
				var html = "Cannot continue until the following errors are fixed:<ul>";
				for (err in errs) {
					html += "<li> - "+errs[err]+"</li>"
				}
				html += "</ul>"
				$step.step.find('.errors').html(html)
			}
			
			return false;
		});
	}
	
	for (step in $steps) {
		handleStep($steps[step]);
	}
	
	nextStep($steps.s1, $steps.s2, function() {
		var errs = [];
		if ($fields.name.val().length == 0) {
			errs.push("Event name must not be empty")
		}
		return errs;
	});
	nextStep($steps.s2, $steps.s3, function() {
		var errs = [];
		if ($fields.startDate.val().length == 0) {
			errs.push("Event Start date must be a date");
		}
		if ($fields.endDate.val().length == 0) {
			errs.push("Event End date must be a date");
		}
		
		return errs;
	});
	nextStep($steps.s3, $steps.s4, function() { return null; })
	nextStep($steps.s4, $steps.s5, function() {
		var errs = [];
		if ($fields.passwordProtected.is(':checked') && $fields.password.val().length == 0) {
			errs.push("Either disable the password requirement or fill in a password");
		}
		
		return errs;
	});
	nextStep($steps.s5, $steps.s6, function() { return null; });
	nextStep($steps.s6, $lastStep, function() {
		var errs = [];
		
		if ($fields.name.val().length == 0) {
			errs.push("Required - Event name must not be blank!");
		}
		if ($fields.startDate.val().length == 0) {
			errs.push("Required - Event Start date must be a date");
		}
		if ($fields.endDate.val().length == 0) {
			errs.push("Required - Event End date must be a date");
		}
		if ($fields.passwordProtected.is(':checked') && $fields.password.val().length == 0) {
			errs.push("Required - Either disable the password requirement or fill in a password");
		}
		
		if (errs.length == 0) {
			// all good, populate ul#overview
			var html = "";
			
			html += "<li> - Event is called '"+$fields.name.val()+"'</li>";
			html += "<li> - Starts on the "+$fields.startDate.val()+"</li>";
			html += "<li> - Ends on the "+$fields.endDate.val()+"</li>";
			if ($fields.passwordProtected.is(":checked")) {
				html += "<li> - Is password protected, password is "+$fields.password.val()+"</li>";
			} else {
				html += "<li> - Is <strong>not</strong> password protected, anyone can access it</li>"
			}
			html += "<li> - Happening at "+$fields.address.val()+"</li>";
			html += "<li> - Event requires users to be "+$("#step3 input[name='locationRestriction']").val()+" close to the event</li>";
			html += "<li> - Users can request access to the event even though they do not meet the following restrictions:</li>";
			if ($("#EventTimePeriod").is(":checked")) {
				html += "<li> &nbsp;&nbsp; - Time Period - Enable attendees to request to join the event even though the event has expired</li>";
			}
			if ($("#EventPasswordRestriction").is(":checked")) {
				html += "<li> &nbsp;&nbsp; - Password - Let attendees request to join the event if they do not know the password</li>"
			}
			if ($("#EventLocationRestriction").is(":checked")) {
				html += "<li> &nbsp;&nbsp; - Location - Show the event to all attendees regardless of their current location</li>";
			}
			if ($("#EventAllowCreateCategories").is(":checked")) {
				html += "<li> - Allow attendees to create their own categories";
			}
			
			html += "<li> - Predefined attendee categories:</li>";
			var cats = $("#selectedCategories").find("option").each(function() {
				html += "<li> &nbsp;&nbsp - "+$(this).attr("value")+"</li>";
			});
			
			$("ul#overview").html(html);
		}
		
		return errs;
	})
	
	$("#addCategories").click(function() {
		var selected = $("#availableCategories").val()
		if (selected != null) {
			var html = "";
			for (select in selected) {
				html += "<option value='"+selected[select]+"'>"+selected[select]+"</option>";
				$("#availableCategories").find("option[value='"+selected[select]+"']").remove();
			}
			$("#selectedCategories").append(html);
		}
	})
	$("#removeCategories").click(function() {
		var selected = $("#selectedCategories").val()
		if (selected != null) {
			var html = "";
			for (select in selected) {
				html += "<option value='"+selected[select]+"'>"+selected[select]+"</option>";
				$("#selectedCategories").find("option[value='"+selected[select]+"']").remove();
			}
			$("#availableCategories").append(html);
		}
	})
	$("#addCustomCategory").click(function() {
		var cat = $("#customCategory");
		var val = cat.val();
		if (val.length != 0) {
			$("#selectedCategories").append("<option value="+val+">"+val+"</option>");
			cat.val("");
		}
	})
});