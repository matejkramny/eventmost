/**
 *
 * HTML5 Image uploader with Jcrop
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2012, Script Tutorials
 * http://www.script-tutorials.com/
 */

var examples = [];

                    examples.push(function (){
                        $('#userpic').fileapi({
                            url: 'http://rubaxa.org/FileAPI/server/ctrl.php',
                            accept: 'image/*',
                            imageSize: { minWidth: 256, minHeight: 171 },
                            elements: {
                                active: { show: '.js-upload', hide: '.js-browse' },
                                preview: {
                                    el: '.js-preview',
                                    width: 256 ,
                                    height: 171
                                },
                                progress: '.js-progress'
                            },
                            onSelect: function (evt, ui){
                                var file = ui.files[0];

                                if( file ){
                                    $('#popup').modal({
                                        closeOnEsc: true,
                                        closeOnOverlayClick: false,
                                        onOpen: function (overlay){
                                            $(overlay).on('click', '.js-upload', function (){
                                                $.modal().close();
                                                $('#userpic').fileapi('upload');
                                            });

                                            $('.js-img', overlay).cropper({
                                                file: file,
                                                bgColor: '#ccc',
                                                maxSize: [$(window).width()-100, $(window).height()-100],
                                                minSize: [256, 171],
                                                selection: '90%',
                                                onSelect: function (coords){
                                                    $('#userpic').fileapi('crop', file, coords);
                                                }
                                            });
                                        }
                                    }).open();
                                }
                            }
                        });
                    });

jQuery(function ($){
            var $blind = $('.splash__blind');

            $('.splash')
                .mouseenter(function (){
                    $('.splash__blind', this)
                        .animate({ top: -10 }, 'fast', 'easeInQuad')
                        .animate({ top: 0 }, 'slow', 'easeOutBounce')
                    ;
                })
                .click(function (){
                    if( !FileAPI.support.media ){
                        $blind.animate({ top: -$(this).height() }, 'slow', 'easeOutQuart');
                    }

                    FileAPI.Camera.publish($('.splash__cam'), function (err, cam){
                        if( err ){
                            alert("Unfortunately, your browser does not support webcam.");
                        } else {
                            $('.splash').off();
                            $blind.animate({ top: -$(this).height() }, 'slow', 'easeOutQuart');
                        }
                    });
                })
            ;





            $('body').on('click', '[data-tab]', function (evt){
                evt.preventDefault();

                var el = evt.currentTarget;
                var tab = $.attr(el, 'data-tab');
                var $example = $(el).closest('.example');

                $example
                    .find('[data-tab]')
                        .removeClass('active')
                        .filter('[data-tab="'+tab+'"]')
                            .addClass('active')
                            .end()
                        .end()
                    .find('[data-code]')
                        .hide()
                        .filter('[data-code="'+tab+'"]').show()
                ;
            });


            function _getCode(node, all){
                var code = FileAPI.filter($(node).prop('innerHTML').split('\n'), function (str){ return !!str; });
                if( !all ){
                    code = code.slice(1, -2);
                }

                var tabSize = (code[0].match(/^\t+/) || [''])[0].length;

                return $('<div/>')
                    .text($.map(code, function (line){
                        return line.substr(tabSize).replace(/\t/g, '   ');
                    }).join('\n'))
                    .prop('innerHTML')
                        .replace(/ disabled=""/g, '')
                        .replace(/&amp;lt;%/g, '<%')
                        .replace(/%&amp;gt;/g, '%>')
                ;
            }


            // Init examples
            FileAPI.each(examples, function (fn){
                fn();
            });
        });

// convert bytes into friendly format
function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB'];
    if (bytes == 0) return 'n/a';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
};

// check for selected crop region
function checkForm() {
    if (parseInt($('#w').val())) return true;
    $('.error').html('Please select a crop region and then press Upload').show();
    return false;
};

// update info by cropping (onChange and onSelect events handler)
function updateInfo(e) {
    $('#x1').val(e.x);
    $('#y1').val(e.y);
    $('#x2').val(e.x2);
    $('#y2').val(e.y2);
    $('#w').val(e.w);
    $('#h').val(e.h);
};

// clear info by cropping (onRelease event handler)
function clearInfo() {
    $('.info #w').val('');
    $('.info #h').val('');
};

function fileSelectHandler() {

    // get selected file
    var oFile = $('#avatar')[0].files[0];

    // hide all errors
    $('.error').hide();

    // check for image type (jpg and png are allowed)
    var rFilter = /^(image\/jpeg|image\/png)$/i;
    if (! rFilter.test(oFile.type)) {
        $('.error').html('Please select a valid image file (jpg and png are allowed)').show();
        return;
    }

    // check for file size
    if (oFile.size > 250 * 1024) {
        $('.error').html('You have selected too big file, please select a one smaller image file').show();
        return;
    }

    // preview element
    var oImage = document.getElementById('preview');

    // prepare HTML5 FileReader
    var oReader = new FileReader();
        oReader.onload = function(e) {

        // e.target.result contains the DataURL which we can use as a source of the image
        oImage.src = e.target.result;
        oImage.onload = function () { // onload event handler

            // display step 2
            $('.step2').fadeIn(500);

            // display some basic image info
            var sResultFileSize = bytesToSize(oFile.size);
            $('#filesize').val(sResultFileSize);
            $('#filetype').val(oFile.type);
            $('#filedim').val(oImage.naturalWidth + ' x ' + oImage.naturalHeight);

            // Create variables (in this scope) to hold the Jcrop API and image size
            var jcrop_api, boundx, boundy;

            // destroy Jcrop if it is existed
            if (typeof jcrop_api != 'undefined') 
                jcrop_api.destroy();

            // initialize Jcrop
            $('#preview').Jcrop({
                minSize: [50, 32], // min crop size
                aspectRatio: 150/100,
                bgFade: true, // use fade effect
                bgOpacity: .3, // fade opacity
                onChange: updateInfo,
                onSelect: updateInfo,
                onRelease: clearInfo
            }, function(){

                // use the Jcrop API to get the real image size
                var bounds = this.getBounds();
                boundx = bounds[0];
                boundy = bounds[1];

                // Store the Jcrop API in the jcrop_api variable
                jcrop_api = this;
            });
        };
    };

    // read selected file as DataURL
    oReader.readAsDataURL(oFile);
}