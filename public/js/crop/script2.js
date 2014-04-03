                   
$(document).ready(function() {

                    examples.push(function (){
                        $('#userpic').fileapi({
                            url: 'http://rubaxa.org/FileAPI/server/ctrl.php',
                            accept: 'image/*',
                            imageSize: { minWidth: 200, minHeight: 200 },
                            elements: {
                                active: { show: '.js-upload', hide: '.js-browse' },
                                preview: {
                                    el: '.js-preview',
                                    width: 200,
                                    height: 200
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
                                                bgColor: '#fff',
                                                maxSize: [$(window).width()-100, $(window).height()-100],
                                                minSize: [200, 200],
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

    });
});