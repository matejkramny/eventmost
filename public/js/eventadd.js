$(document).ready(function() {
	$("#mycarouse, #mycarousel2").jcarousel({
		vertical: true,
		scroll: 2
	});
	
	var editor = new TINY.editor.edit('editor', {
		id: 'tinyeditor',
		width: 1180,
		height: 175,
		cssclass: 'tinyeditor',
		controlclass: 'tinyeditor-control',
		rowclass: 'tinyeditor-header',
		dividerclass: 'tinyeditor-divider',
		controls: ['bold', 'italic', 'underline', 'strikethrough', 'leftalign', 'centeralign', 'rightalign', 'blockjustify', 'font', 'size',],
		footer: true,
		fonts: ['Raleway', 'Verdana','Arial','Georgia','Trebuchet MS'],
		xhtml: true,
		cssfile: '/css/tinymce.iframe.css',
		bodyid: 'editor',
		footerclass: 'tinyeditor-footer',
		resize: {
			cssclass: 'resize'
		}
	});
	
	// Datepicker
	$(".datepickerWrapper .nowButton").click(function() {
		var now = new Date();
		var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2);
		$(this).parent().parent().find('input[type=time]').val(time)
	})
	
	// Enable categories
	$enablecategoriesNo = $("#cbox8")
	$enablecategoriesYes = $("#cbox7")
	
	$enablecategoriesNo.click(function() {
		$enablecategoriesNo.attr('checked', true);
		$enablecategoriesYes.attr('checked', false);
	})
	$enablecategoriesYes.click(function() {
		$enablecategoriesNo.attr('checked', false);
		$enablecategoriesYes.attr('checked', true);
	})
	
	// Ticket table thing
	$ticketstable = $('#tickets-table');
	$ticketsno = $("#cbox10");
	$ticketsyes = $("#cbox9");
	
	function enableTicketsTable(enable) {
		if (enable === true) {
			$ticketstable.find(".disabled-image, .disabled-lock").css("display", "none");
			$ticketsno.attr('checked', false);
			$ticketsyes.attr('checked', true);
		} else {
			$ticketstable.find(".disabled-image, .disabled-lock").css("display", "inline");
			$ticketsno.attr('checked', true);
			$ticketsyes.attr('checked', false);
		}
	}
	
	$ticketsno.click(function() {
		var checked = false;
		enableTicketsTable(checked);
	})
	$ticketsyes.click(function() {
		var checked = true;
		enableTicketsTable(checked);
	})
	
	// Avatar upload
	var avatarUploadRequest;
	var file;
	$("#file_browse").change(function() {
		var files = this.files;
		
		for (var i = 0; i < files.length; i++) {
			file = files[i];
			break;
		}
		
		if (typeof file === "undefined" || file == null) {
			return;
		}
		
		var reader = new FileReader();
		reader.onload = function(img) {
			$("#avatar_preview").attr('src', img.target.result);
		}
		reader.readAsDataURL(file);
	})
	
	$("#file_upload_wrapper").click(function() {
		if (typeof file === "undefined" || file == null) {
			// opens the dialog
			$("#file_browse").trigger('click');
			return;
		}
		
		$("#avatarStatus").html("<br/>Uploading..");
		
		var form = new FormData();
		form.append("_csrf", $("head meta[name=_csrf]").attr('content'));
		form.append("avatar", file);
		avatarUploadRequest = new XMLHttpRequest();
		avatarUploadRequest.responseType = "json";
		avatarUploadRequest.onreadystatechange = xmlhttprequestResponse;
		avatarUploadRequest.open("POST", "/event/add/avatar");
		avatarUploadRequest.send(form);
	});
	
	$("#file_delete_wrapper").click(function() {
		file = null;
		avatarUploadRequest = null;
		
		$("#avatar_preview").attr('src', '/img/default_logo.svg');
		
		var avId = $("#avatar_id").val();
		$("#avatar_id").val('');
		
		$("#file_browse").attr("name", "avatar");
		
		$.ajax({
			url: "/event/"+avId+"/avatar/remove",
			type: "GET"
		})
	});
	
	function xmlhttprequestResponse () {
		if (avatarUploadRequest.readyState == 4) {
			if (avatarUploadRequest.status == 200) {
				result = JSON.parse(avatarUploadRequest.response);
				console.log(result);
				console.log(typeof result);
				if (result.status != 200) {
					alert("Could not upload image\n"+result.err);
				} else {
					// store the avatar id in the form.
					$("#file_browse").removeAttr("name");
					$("#avatar_id").attr('value', result.id);
					$("#avatarStatus").html("<br/>Uploaded");
				}
			} else {
				// Not ok
				alert(avatarUploadRequest.statusText);
			}
		}
	}
});