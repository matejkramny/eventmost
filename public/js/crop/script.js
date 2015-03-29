//Make global variables for selected image for further usage
var selectImgWidth,selectImgHeight,selectImgWidth2,selectImgHeight2,jcrop_api, jcrop_api2, boundx, boundy, boundx2, boundy2, isError=false, isError2=false;
window.URL = window.URL || window.webkitURL;
$(document).ready(function(){
    $("#file_browse1").change(function(){

        if (typeof jcrop_api != 'undefined'){
            jcrop_api.destroy();
            $('#load_img').replaceWith('<img id="load_img" />');
        }

        var previewId = document.getElementById('load_img');
        var thumbId = document.getElementById('thumb');
        previewId.src = '';
        var flag = 0;

        
        
        // Get selected file parameters
        var selectedImg = $('#file_browse1')[0].files[0];
        
        //Check the select file is JPG,PNG or GIF image
        var regex = /^(image\/jpeg|image\/png)$/i;
        if (! regex.test(selectedImg.type)) {
            $('#error').html('Please select a valid image file (jpg and png are allowed)').fadeIn(500);
            flag++;
            isError = true;
        }
        
        // Check the size of selected image if it is greater than 250 kb or not
        else if (selectedImg.size > 2048 * 1024) {
            $('#error').html('The file you selected is too big. Max file size limit is 2MB').fadeIn(500);
            //$('#info-m').html('Select part of image you want to crop').fadeIn(500);
            flag++;
            isError = true;
        }


        image = new Image();

        image.onload = function() {

            if(this.width < 300 || this.height < 200){
                $('#image_div').hide();
                $('#info-m').hide();
                thumbId.src = '';
                $('#error').html('The file you selected is too small for logo.').fadeIn(500);
                flag++;
                isError = true;
            }else{
                if(flag==0){
                    isError=false;
                    $('#error').hide(); //if file is correct then hide the error message
                    $('#info-m').show(); //if file is correct then hide the error message
                    // destroy Jcrop if it is already existed
                    
                        

                    // Preview the selected image with object of HTML5 FileReader class
                    // Make the HTML5 FileReader Object
                    var oReader = new FileReader();
                        oReader.onload = function(e) {

                        // e.target.result is the DataURL (temporary source of the image)
                            thumbId.src = previewId.src=e.target.result;
                            
                            // FileReader onload event handler
                            previewId.onload = function () {

                            // display the image with fading effect
                            $('#image_div').fadeIn(500);
                            selectImgWidth = previewId.naturalWidth; //set the global image width
                            selectImgHeight = previewId.naturalHeight;//set the global image height
                            
                            // Create variables (in this scope) to hold the Jcrop API and image size
                           
                            

                            // initialize Jcrop Plugin on the selected image
                            $('#load_img').Jcrop({
                                minSize: [300, 200], // min crop size
                                setSelect: [0,0,305,205],
                                aspectRatio: 300/200,
                                //aspectRatio: 312/158, //keep aspect ratio
                                bgFade: true, // use fade effect
                                bgOpacity: .3, // fade opacity
                                boxWidth : 800,
                                boxHeight : 800,
                                onChange: showThumbnail,
                                onSelect: showThumbnail
                            }, function(){

                                // use the Jcrop API to get the real image size
                                var bounds = this.getBounds();
                                boundx = bounds[0];
                                boundy = bounds[1];

                                // Store the Jcrop API in the jcrop_api variable
                                jcrop_api = this;
                                $('#info-m').html('Select part of image you want to crop').fadeIn(500);
                            });
                        };
                    };

                    // read selected file as DataURL
                    oReader.readAsDataURL(selectedImg);
                }
            }
        };

        image.src = window.URL.createObjectURL(selectedImg);
        
        
    })

    
    $("#file_browse2").change(function(){

        if (typeof jcrop_api2 != 'undefined'){
            jcrop_api2.destroy();
            $('#load_img2').replaceWith('<img id="load_img2" />');
        }
        var previewId = document.getElementById('load_img2');
        //var thumbId = document.getElementById('thumb2');
        previewId.src = '';
        $('#image_div2').hide();
        var flag = 0;
        
        // Get selected file parameters
        var selectedImg = $('#file_browse2')[0].files[0];
        
        //Check the select file is JPG,PNG or GIF image
        var regex = /^(image\/jpeg|image\/png)$/i;
        if (! regex.test(selectedImg.type)) {
            $('#error2').html('Please select a valid image file (jpg and png are allowed)').fadeIn(500);
            flag++;
            isError2 = true;
        }
        
        // Check the size of selected image if it is greater than 250 kb or not
        else if (selectedImg.size > 2048 * 1024) {
            $('#error2').html('The file you selected is too big. Max file size limit is 2MB').fadeIn(500);
            //$('#info-m2').html('Select part of image you want to crop').fadeIn(500);
            flag++;
            isError2 = true;
        }

        image = new Image();

        image.onload = function() {

            if(this.width < 500 || this.height < 200){
                $('#image_div2').hide();
                $('#info-m2').hide();
                //thumbId.src = '';
                $('#error2').html('The file you selected is too small for background.').fadeIn(500);
                flag++;
                isError = true;
            }else{
                if(flag==0){
                    isError2=false;
                    $('#error2').hide(); //if file is correct then hide the error message
                    $('#info-m2').show(); //if file is correct then hide the error message
                    // destroy Jcrop if it is already existed
                    
                        

                    // Preview the selected image with object of HTML5 FileReader class
                    // Make the HTML5 FileReader Object
                    var oReader = new FileReader();
                        oReader.onload = function(e) {

                        // e.target.result is the DataURL (temporary source of the image)
                            previewId.src=e.target.result;
                            
                            // FileReader onload event handler
                            previewId.onload = function () {

                            // display the image with fading effect
                            $('#image_div2').fadeIn(500);
                            selectImgWidth = previewId.naturalWidth; //set the global image width
                            selectImgHeight = previewId.naturalHeight;//set the global image height
                            
                            // Create variables (in this scope) to hold the Jcrop API and image size
                           
                            

                            // initialize Jcrop Plugin on the selected image
                            $('#load_img2').Jcrop({
                                minSize: [500, 250], // min crop size
                                setSelect: [0,0,500,250],
                                aspectRatio: 500/250,
                                //aspectRatio: 312/158, //keep aspect ratio
                                bgFade: true, // use fade effect
                                bgOpacity: .3, // fade opacity
                                boxWidth : 800,
                                boxHeight : 400,
                                onChange: showThumbnail2,
                                onSelect: showThumbnail2
                            }, function(){

                                // use the Jcrop API to get the real image size
                                var bounds = this.getBounds();
                                boundx = bounds[0];
                                boundy = bounds[1];

                                // Store the Jcrop API in the jcrop_api variable
                                jcrop_api2 = this;
                                $('#info-m2').html('Select part of image you want to crop').fadeIn(500);
                            });
                        };
                    };

                    // read selected file as DataURL
                    oReader.readAsDataURL(selectedImg);
                }
            }
        };

        image.src = window.URL.createObjectURL(selectedImg);
    });
})

function showThumbnail(e)
{
    window.setCoordinates(e);
    var rx = 300 / e.w; //155 is the width of outer div of your profile pic
    var ry = 150 / e.h; //190 is the height of outer div of your profile pic
    $('#w').val(e.w);
    $('#h').val(e.h);
    //$('#w1').val(e.w);
    //$('#h1').val(e.h);
    $('#x1').val(e.x);
    $('#y1').val(e.y);
    $('#x2').val(e.x2);
    $('#y2').val(e.y2);
    $('#thumb').css({
        width: Math.round(rx * selectImgWidth) + 'px',
        height: Math.round(ry * selectImgHeight) + 'px',
        marginLeft: '-' + Math.round(rx * e.x) + 'px',
        marginTop: '-' + Math.round(ry * e.y) + 'px'
    });

    //console.log(Math.round(e.w) +" - "+ Math.round(e.h));

    $('#realdimensionlabel').html("Selected: "+ Math.round(e.w) + " x "+Math.round(e.h));
    
}

function validateForm(){
    if ($('#file_browse1').val()=='') {
        $('#error').html('Please select an image').fadeIn(500);
        return false;
    }else if(isError){
        return false;
    }else {
        return true;
    }
}

function showThumbnail2(e)
{
    window.setCoordinates(e);
    var rx = 350 / e.w; //155 is the width of outer div of your profile pic
    var ry = 150 / e.h; //190 is the height of outer div of your profile pic
    $('#w2').val(e.w);
    $('#h2').val(e.h);
   // $('#w12').val(e.w);
    //$('#h12').val(e.h);
    $('#x12').val(e.x);
    $('#y12').val(e.y);
    $('#x22').val(e.x2);
    $('#y22').val(e.y2);
    /*$('#thumb2').css({
        width: Math.round(rx * selectImgWidth2) + 'px',
        height: Math.round(ry * selectImgHeight2) + 'px',
        marginLeft: '-' + Math.round(rx * e.x) + 'px',
        marginTop: '-' + Math.round(ry * e.y) + 'px'
    });*/

    $('#realdimensionlabel2').html("Selected: "+ Math.round(e.w) + " x "+Math.round(e.h));
}

function validateForm2(){
    if ($('#file_browse2').val()=='') {
        $('#error2').html('Please select an image').fadeIn(500);
        return false;
    }else if(isError){
        return false;
    }else {
        return true;
    }
}

function deleteImage(imgDiv){
    //alert("helo");
    var thumbId = document.getElementById('thumb');
    thumbId.src = '/images/pro.svg';

    //alert(imgDiv);
    //jcrop_api.destroy();
    $('#'+imgDiv).fadeOut(500);
}