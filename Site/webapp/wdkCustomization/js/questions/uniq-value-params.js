/* global $, wdk */

(function() {
  var initEvent = wdk.parameterHandlers.QUESTION_INITIALIZE_EVENT;

  $(document).on(initEvent, '[data-uniq-value-params]', function(event) {
    var $el = $(event.target);
    initUniqValueParams($el.closest('form'), $el.data('uniq-value-params'));
  });

  function initUniqValueParams($form, paramNames) {
    $form.on('change', validateWith(paramNames));
    $form.on('submit', validateWith(paramNames, true));
  }

  function validateWith(paramNames, preventOnValidationError) {
    return function validate(event) {
      var $form = $(event.currentTarget);
      var errors = makeErrorRecords(makeParamRecords(paramNames, $form));
      var $messageDiv = getMessageDiv(event.currentTarget);

      // clear previous valdity messages
      paramNames.forEach(function(name) {
        $form.find(makeParamSelector(name)).toArray().forEach(function(el) {
          $(el).parent().qtip('destroy').find('.eupathdb__invalid').remove();
        });
      });

      errors.forEach(function(error) {
        error.param.$el
          .parent()
          .qtip({
            content: {
              text: '<div style="color: darkred;">' + error.message + '</div>'
            },
            position: {
              my: 'top center',
              at: 'bottom center'
            },
            style: {
              classes: 'qtip-bootstrap'
            }
          })
          .not(':has(.eupathdb__invalid)')
          .prepend($('<div class="eupathdb__invalid"/>').css({
            'box-shadow': '0 0 4px 1px red',
            width: error.param.$el.width(),
            height: error.param.$el.height(),
            'border-radius': Math.floor(error.param.$el.width() / 2),
            position: 'absolute',
            display: 'inline-block'
          }))
      });

      if (errors.length > 0) {
        if (preventOnValidationError) event.preventDefault();
        $messageDiv.show(400, function() {
          errors[0].param.$el.qtip('show');
        })
      }
      else {
        $messageDiv.hide(400)
      }
    }
  }

  function makeParamSelector(name, isChecked) {
    return '[name="value(' + name + ')"],[name="array(' + name + ')"]' +
      (isChecked ? ':checked' : '');
  }

  function makeParamRecords(paramNames, $form) {
    return paramNames.map(function(name) {
      var $el = $form.find(makeParamSelector(name, true));
      var displayName = $el.closest('.param-item').find('>label').text().trim();
      return {
        name: name,
        displayName: displayName,
        $el: $el
      };
    });
  }

  function makeErrorRecords(params) {
    return params.map(function(param) {
      var duplicates = params.filter(function(otherParam) {
        return param.name !== otherParam.name && param.$el.val() === otherParam.$el.val();
      });
      return {
        param: param,
        message: formatCustomValidityMessage(duplicates)
      };
    }).filter(function(error) {
      return error.message;
    })
  }

  function formatCustomValidityMessage(duplicateParams) {
    var otherParams = duplicateParams.map(function(param) {
      return param.displayName;
    }).join(', ')
    return otherParams ? 'This value must be different from ' + otherParams : '';
  }

  var getMessageDiv = _.memoize(function(form) {
    return $(
      '<div style="text-align: center; display: none;">' +
      '  <p style="color: darkred; display: inline-block; padding: 8px; border: 1px solid #a4a4a4; border-radius: 4px; font-size: 1.2em;">' +
      '    <i style="color: orange;" class="fa fa-warning"/> ' +
      '    Please fix the errors below.' +
      '  </p>' +
      '</div>')
      .insertBefore(form);
  })

})();
