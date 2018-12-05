/*
 * A jQuery plugin to submit forms with files via AJAX and to get a response with errors.
 * Browsers without FormData uses iframe transport to send files.
 *
 * @author Gozoro <gozoro@yandex.ru>
 */




(function($)
{

	/**
	 * Create FormData object from form
	 * @return {FormData}
	 */
	$.fn.createFormData = function()
	{
		if(window.FormData !== undefined)
		{
			var fd = new FormData();

			$.each(this.serializeArray(), function (i, input)
			{
				fd.append(input.name, input.value);
			});

			$.each(this.find("input[type='file']"), function(i, input_file)
			{
				$.each($(input_file)[0].files, function(i, file)
				{
					fd.append(input_file.name, file);
				});
			});
		}
		else
		{
			// Browser not supported FormData
			var fd = undefined;
		}

		return fd;
	};


	/**
	 * Bind an event handler to the "submitajax" plugin event, or trigger that event on an element.
	 * If the browser does not support FormData, a POST request without files will be sent.
	 *
	 * @param {function} success
	 * @return {this}
	 */
	$.fn.submitAjax = function(success)
	{
		if(success)
			return this.on('submitajax', success);
		else
			return this.submit();
	}



})(jQuery);





$(document).ready(function()
{
	var event_name = "submitajax";


	var input_reset = function($form, input)
	{
		var $input       = $(input);
		var element      = $input.data('element');
		var errorClass   = $input.data('error-class');
		var errorElement = $input.data('error-element');
		var errorAttr    = $input.data('error-attr');

		if(errorClass)
		{
			if(element)
			{
				$form.find(element).removeClass(errorClass);
			}
			else
			{
				$input.removeClass(errorClass);
			}
		}

		if(errorAttr)
		{
			if(errorElement)
			{
				$form.find(errorElement).removeAttr(errorAttr);
			}
			else
			{
				$input.removeAttr(errorAttr);
			}
		}
		else
		{
			if(errorElement)
			{
				$form.find(errorElement).html('');
			}
		}
	}


	$('form').on('submit', function(event)
	{
		var $form = $(this);
		var via = $form.data('via');

		if(/^ajax$/i.test(via))
		{
			var url = $form.attr('action');

			if($form.find('input[type=file]').length)
			{
				if(window.FormData !== undefined)
				{

					event.preventDefault();
					var data = $form.createFormData();

					$.ajax({
						url: url,
						type: 'POST',
						data: data,
						processData: false,
						contentType: false,
						xhrFields: {
							withCredentials: true
						},
						success: function(response, textStatus, jqXHR)
						{
							$form.trigger(event_name, [response, textStatus, jqXHR]);
						}
					});

				}
				else
				{

					// Browser not supported FormData
					// Use iframe transport

					var iframe_id = 'ajaxformiframe';
					var $iframe = $('<iframe name='+ iframe_id +' id="'+ iframe_id +'" width="0" height="0" frameborder="0" style="border:none;visibility:hidden;display:none;"></iframe>');

					$form.append($iframe).attr('target',iframe_id);

					$iframe.load(function()
					{
						var response = $iframe.contents().find('body').text();

						try
						{
							var json = $.parseJSON(response);
							$form.trigger(event_name, [json, 'success', null]);
						}
						catch(e)
						{
							$form.trigger(event_name, [response, 'success', null]);
						}

						// remove iframe
						$form.removeAttr('target');
						$iframe.contents().find('body').html('');
						$iframe.unbind('load');
						$iframe.remove();
					});

				}
			}
			else
			{
				event.preventDefault();
				var data = $form.serializeArray();
				$.post(url, data, function(response, textStatus, jqXHR)
				{
					$form.trigger(event_name, [response, textStatus, jqXHR]);
				});
			}







			/////////////////////////////////
			$form.submitAjax(function(event, response)
			{
				if(response.errors)
				{
					for(var field in response.errors)
					{
						var $input = $form.find(':input[name='+field+']');
						var errorMessage = response.errors[field];

						var element      = $input.data('element');
						var errorClass   = $input.data('error-class');
						var errorElement = $input.data('error-element');
						var errorAttr    = $input.data('error-attr');

						if(errorClass)
						{
							if(element)
							{
								$form.find(element).addClass(errorClass);
							}
							else
							{
								$input.addClass(errorClass);
							}
						}


						if(errorAttr)
						{
							if(errorElement)
							{
								$form.find(errorElement).attr(errorAttr, errorMessage);
							}
							else
							{
								$input.attr(errorAttr, errorMessage);
							}
						}
						else
						{
							if(errorElement)
							{
								$form.find(errorElement).html(errorMessage);
							}
						}
					}
				}
			});

			$form.find(':input').change(function()
			{
				input_reset($form, this);
			});



			$form.on('reset',function()
			{
				$form.find(':input').each(function(i, input)
				{
					input_reset($form, input);
				});
			});

		}
	});

});
