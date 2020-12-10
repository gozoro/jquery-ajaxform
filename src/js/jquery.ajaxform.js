/*
 * A jQuery plugin to submit forms with files via AJAX and to get a response with errors.
 * Browsers without FormData uses iframe transport to send files.
 *
 * @author Gozoro <gozoro@yandex.ru>
 */




;(function($)
{
	'use strict';

	/**
	 * Bind an event handler to the "submitajax" plugin event, or trigger that event on an element.
	 *
	 * @param {function} success
	 * @return {this}
	 */
	$.fn.submitAjax = function(success)
	{
		if(success)
			return $(this).on('submitajax', success);
		else
			return $(this).submit();
	}


	$.fn.ajaxform = function()
	{
		var $ajaxform = this;
		var event_name = "submitajax";

		/**
		 * Create FormData object from form
		 * @return {FormData}
		 */
		var createFormData = function($form)
		{
			if(window.FormData !== undefined)
			{
				var fd = new FormData();

				$.each($form.serializeArray(), function (i, input)
				{
					fd.append(input.name, input.value);
				});

				$.each($form.find("input[type='file']"), function(i, input_file)
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
		}


		var resetInput = function(input)
		{
			var $input       = $(input);
			var $form        = $input.parents('form');
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


		var submitHandler = function(event)
		{
			var $form = $(this);

			var url = $form.attr('action');


			if($form.find('input[type=file]').length)
			{
				if(window.FormData !== undefined)
				{

					event.preventDefault();
					var data = createFormData($form);

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
		}



		var errorHandler = function(event, response)
		{
			var $form = $(this);


			if(response.errors)
			{
				for(var field in response.errors)
				{
					var $input = $form.find(':input[name='+field+'],:input[name^="'+field+'["]');
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
		}

		var resetHandler = function()
		{
			$(this).find(':input').each(function(i, input)
			{
				resetInput(input);
			});
		}

		// plugin init
		var init = function()
		{
			if(!$ajaxform.data('ajaxform'))
			{
				$ajaxform.data('ajaxform', 1);

				var selector = $ajaxform.selector; //this property was deprecated in jQuery 1.7

				if(!selector)
				{
					selector = $ajaxform.attr('id');
					if(selector)
						selector = '#'+selector;
				}

				if(selector)
				{
					// form delegate event handlers
					$(document)
							.on('submit.ajaxform', selector, submitHandler)
							.on(event_name, selector, errorHandler)
							.on('keyup change reset', selector+' :input', function(){resetInput(this)})
							.on('reset', selector, resetHandler)
							;

				}
				else
				{
					// form event handlers
					$ajaxform
							.on('submit.ajaxform', submitHandler)
							.on(event_name, errorHandler)
							.on('keyup change', ':input', function(){resetInput(this)})
							.on('reset', resetHandler)
							;
				}
			}
		};

		init();

		return $ajaxform;
	}

})(jQuery);


// run plugin for form with data-form="ajaxform"
$(document).ready(function()
{
	$('form[data-form=ajaxform]').ajaxform();
});