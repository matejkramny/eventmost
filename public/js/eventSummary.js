$(document).ready(function() {
	$.plot("#graph", [{
		data: [
			[0, 27],
			[1, 13],
			[2, 19],
			[3, 32]
		],
		lines: { show: true }
	}])
})