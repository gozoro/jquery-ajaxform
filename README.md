
jquery-ajaxform
===============

 A jQuery plugin to submit forms with files via AJAX and to get a response with errors.
 Browsers without FormData uses iframe transport to send files.


`jquery-ajaxform` attaches callback hooks to a form's submit event.
of a form send or a file upload.

Requirements
------------

+ jQuery version 1.7.0 and up


Installation
------------

```
composer require gozoro/jquery-ajaxform
```


Usage
-----

Reference the plugin and jQuery:

	<script src='/resources/js/jquery.js' type='text/javascript'></script>
	<script src='/resources/js/jquery.ajaxform.js' type='text/javascript'></script>


Declare your form as usual:

	<form id="myform" method="POST" action="/" enctype="multipart/form-data" data-via="ajax">
		<input name="name" id="name" type="text" />
		<input name="files[] id="files" type="file" />
		<input type="submit" />
	</form>

And javascript:

	<script type="text/javascript">
		$(document).ready(function(){

			// Add event handler for "submitajax" event
			$('#myform').submitAjax(function(event, data, textStatus, jqXHR){

				alert('submit ajax response:' + data);

			});
		});
	</script>