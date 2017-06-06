/* global wdk */
wdk.namespace('eupathdb.analysis', function(ns) {

  // Initialize external analysis DOM
  ns.externalAnalysis = function externalAnalysis($el) {

    // Adjust height of iframe to that of contents
    $el.find('iframe').load(function(event) {
      const iframe = event.target;
      const contentHeight = iframe.contentWindow.document.body.scrollHeight;
      const height = Math.max(iframe.height, contentHeight);
      iframe.height = height + 'px';
    });
  };

});
