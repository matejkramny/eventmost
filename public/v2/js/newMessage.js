$(document).ready(function() {
	//TINY editor
	var editor = new TINY.editor.edit('editor', {
		id: 'tinyeditor',
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
})