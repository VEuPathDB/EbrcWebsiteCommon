//
// Common for all record pages
//

(function($) {

  // load content of ajax urls if visble
  function loadWdkAjaxIfVisible() {
    $(document.body).find('wdk-ajax:not([triggered])')
      .filter('[manual]:visible')
      .toArray().forEach(wdk.components.wdkAjax.load);
  }

  $(document)
    .on('click', '.toggle a, .wdk-toggle-name a', loadWdkAjaxIfVisible)
    .ready(loadWdkAjaxIfVisible);

}(jQuery));
