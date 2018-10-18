/* global wdk */
import '!!script-loader!eupathdb/js/newwindow';
import './attributeCheckboxTree';
import './controllerResolver';

// include scroll to top button
import 'eupathdb/js/scroll-to-top';

wdk.namespace("eupath.setup", function(ns, $) {

  // currently only used in ortho's sidebar.tag
  function configureSidebar($sidebar) {
    $sidebar.accordion({
      active: $sidebar.data("default-open-index") || 1,
      animate: 200,
      collapsible: false,
      heightStyle: "content",
      icons:false
    });
  }

  ns.configureSidebar = configureSidebar;

});
