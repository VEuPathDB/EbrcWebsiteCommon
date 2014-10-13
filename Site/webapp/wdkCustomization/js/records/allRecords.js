//
// Common for all record pages
//

(function($) {

  // label[in viewport] : Uncomment below to only load when element is in viewport
  // var elementNearViewport = wdk.util.elementNearViewport;

  // load content of ajax urls when visble
  setInterval(function loadWdkAjaxOnVisible() {
    $(document.body).find('wdk-ajax:not([triggered])')
      .filter('[manual]:visible')
      // label[in viewport] : Uncomment below to only load when element is in viewport
      // .filter(function(i, e) { return elementNearViewport(e); })
      .toArray().forEach(wdk.components.wdkAjax.load);
  }, 200);

}(jQuery));
