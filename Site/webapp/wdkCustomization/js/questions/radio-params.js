/* global $, wdk */

(function() {
  var initEvent = wdk.parameterHandlers.QUESTION_INITIALIZE_EVENT;

  $(document).on(initEvent, '[data-radio-params]', function(event) {
    var $el = $(event.target);
    try {
      initRadioParams($el.closest('form'), $el.data('radio-params'));
    }
    catch(err) {
      alert("Unable to initialize radio-params:\n" + err.message);
      console.error(err);
    }
  });

  /**
   * Add radio buttons around term and wildcard params
   */
  function initRadioParams($form, params) {
    var termName = params[0];
    var wildcardName = params[1];

    if (!termName || !wildcardName) {
      throw new Error('The "termName" and "wildcardName" properties must be specified.');
    }

    var termWrapper = $form.find('.param-item:has([name="' +
      termName + '"])');

    var wildcardWrapper = $form.find('.param-item:has([name="' +
      wildcardName + '"])');

    if (termWrapper.length === 0)
      throw new Error("Could not find the param `" + termName + "` in the form.");

    if (wildcardWrapper.length === 0)
      throw new Error("Could not find the param `" + wildcardName + "` in the form.");


    wildcardWrapper.find('input').attr('placeholder', '* returns all results');

    var radioStr = '<div class="param-radio"><input type="radio" name="active-param"/></div>';

    var nonsenseValue = 'N/A';

    var wildcardValue = wildcardWrapper.find('input[name="value(' +
      wildcardName + ')"]').val();

    termWrapper.find('.param-control').prepend(radioStr);
    wildcardWrapper.find('.param-control').prepend(radioStr);

    var nonsenseValueR = new RegExp('^(nil|' + nonsenseValue + ')$', 'i');

    // default term to be selected, unless wildcard has value
    if (wildcardValue && !nonsenseValueR.test(wildcardValue.trim())) {
      wildcardWrapper.find('[name="active-param"]').prop('checked', true);
    } else {
      termWrapper.find('[name="active-param"]').prop('checked', true);
    }

    setActive();

    $form.on('click', '.param-item:has([name="active-param"]:not(:checked))', handleClick);
    $form.on('click', '[name="active-param"]', handleClick)
    $form.on('submit', handleSubmit);

    function setActive() {
      // get selected radio
      var radios = $form.find('[name="active-param"]'),
          checked = radios.filter(':checked');

      radios.parents('.param-item').addClass('inactive');
      checked.parents('.param-item').removeClass('inactive');
    }

    function handleClick(e) {
      var target = e.currentTarget;
      var paramItem = $(target).closest('.param-item');
      // check the .active-param radio for this param
      paramItem.find('[name="active-param"]').prop('checked', true);
      paramItem.find('input:not(:radio)').focus().select();
      setActive();
    }

    function handleSubmit() {
      // add "empty" value to inactive params
      $form.find('.param-item.inactive').find('input').val(nonsenseValue);
      $form.find('.param-item.inactive').find('select')
        .append('<option value="' + nonsenseValue + '"/>').val(nonsenseValue);
    }
  }
})();
