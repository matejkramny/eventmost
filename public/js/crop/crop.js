//$(function(){ $('#jcrop_target').Jcrop(); });
var cropWidth = 400;
var cropHeight = 200;

function showImage(){
	var input = document.getElementById("cardimage");
	var fReader = new FileReader();
	fReader.readAsDataURL(input.files[0]);
	fReader.onloadend = function(event){
		var img = document.getElementById("uploadedimage");
		img.src = event.target.result;

		var previewImg = document.getElementById("preview");
		previewImg.src = event.target.result;

		var path = $("#cardimage").val();
		//console.log(path);

		$('#uploadedimage').Jcrop({
		    bgColor: 'black',
		    bgOpacity: .4,
		    boxWidth : 800,
		    boxHeight : 800,
		    onSelect : updateCoords
		}, function () {
		    jcrop_api = this;
		    

		    // set the selection area [left, top, width, height]
		    jcrop_api.animateTo([0,0,cropWidth,cropHeight]);

		    // you can also set selection area without the fancy animation
		    jcrop_api.setSelect([0,0,cropWidth,cropHeight]);

		});

		$('#selectfile').hide();
		$('#removeUploaded').show();
		$('#savecard').show();
		$('#previewDiv').show();
		
	}
}

function removeUploadedImage(){
	jcrop_api.destroy();
	$('#uploadedimage').attr('src', '');
	$('#selectfile').show();
	$('#removeUploaded').hide();
	$('#savecard').hide();
	$('#previewDiv').hide();
	$('#cardimage').attr({ value: '' }); 
	
}

function updateCoords(c)
{
    $('#x').val(c.x);
    $('#y').val(c.y);
    $('#w').val(c.w);
    $('#h').val(c.h);

    bounds = jcrop_api.getBounds();
	boundx = bounds[0];
	boundy = bounds[1];

    if (parseInt(c.w) > 0)
	{
		var rx = 400 / c.w;
		var ry = 200 / c.h;

		$('#preview').css({
			width: Math.round(rx * boundx) + 'px',
			height: Math.round(ry * boundy) + 'px',
			marginLeft: '-' + Math.round(rx * c.x) + 'px',
			marginTop: '-' + Math.round(ry * c.y) + 'px'
		});
	}


}

function saveCard(){

	var x = $('#x').val();
	var y = $('#y').val();
	var w = $('#w').val();
	var h = $('#h').val();
	var fd = new FormData();

	fd.append('card',document.getElementById('cardimage').files[0]);
	fd.append('x',x);
	fd.append('y',y);
	fd.append('w',w);
	fd.append('h',h);

	$('#loading').show();

	$.ajax({
		url:  "/cards/upload",
		type: "POST",
		data: fd,
		contentType: false,
		processData: false,
		success:function(result){
    		window.location = "/cards";
  		}
  	});
}
