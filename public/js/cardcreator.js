$(document).ready(function() {
	$canvas = $("#cardCanvas");
	$(".libraryBox").draggable().resizable()
	$canvas.droppable({
		drop: function(ev, ui) {
			
		}
	})
	
	var textBoxes = 0;
	$(".addTextBox").click(function() {
		var html = '<div class="libraryBox box'+textBoxes+'">\
		<div class="handle"></div>\
		<input type="text" value="Text">\
		</div>';
		
		$canvas.append(html)
		
		$('.box'+textBoxes).draggable({
			containment: $canvas,
			handle: '.handle'
		}).resizable({
			containment: $canvas
		});
		
		textBoxes++;
	})
	
	$canvas.on('focus', '.libraryBox', function(ev) {
		
	})
})