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
