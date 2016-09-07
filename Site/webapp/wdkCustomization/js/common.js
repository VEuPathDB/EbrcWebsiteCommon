import { createElement } from 'react';
import { render } from 'react-dom';
import Announcements from './client/components/Announcements';

wdk.namespace("eupath.setup", function(ns, $) {

// defines all initial setup logic for Ortho pages not handled by WDK
// functions are called using onload-function 
  var setUpContactUsLogic = function($el) {
    var $form = $el.find("#contact-us");
    var $container = $el.find("#contact-files");

    var addFile = function(idx) {
      return $('<div><input type="file" name="attachment' + idx + '"/> </div>')
      .appendTo($container);
    };

    var $addButton = $("<div><a href='#'>Add another file</a></div>")
    .css("margin-top", "1em")
    .on("click", "a", function(e) {
      e.preventDefault();

      var fileRow = addFile($(":file", fileRow).length + 1);
      $(this).parent().detach();
      $(":file", fileRow).last().trigger("click");
    });


    // enable/disable submit button based on content
    var $submit = $form.find("[type='submit']");
    $submit.prop("disabled", true);
    $form.on("keyup", "[name='content']", function() {
      $submit.prop("disabled", this.value.length === 0);
    });

    // handle file changes
    $form.on("change", ":file", function(e) {

      if ($(this).parent().has(".remove_file").length === 0) {
        // add additional file input, and add/remove links
        $("<span><a href='#'>Remove file</a></span>")
        .addClass("remove_file")
        .css("margin-left", "0.4em")
        .click(function(e) {
          e.preventDefault();

          $(this).parent().remove();

          var $resFiles = $(":file", $form)

          if ($resFiles.length === 0) {
            addFile(1);
          }

          $resFiles.each(function(idx, file) {
            file.name = "attachment" + (idx + 1);
          });

          if ($(":file", $form).length < 3) {
            $addButton.insertAfter($container);
          }

        })
        .insertAfter($(":file", $container).last());
      }

      if ($(":file", $form).length < 3) {
        $addButton.insertAfter($container);
      }
    });

      // submit Contact us via AJAX
      $(document.body).on("submit", "#contact-us", function(e) {
        e.preventDefault();
        var form = this,
            requiredFields = ['content'],
            emailRegex = /^\S+@\S+$/,
            ccAddrs = this.addCc.value.split(/,\s*(?=\w)/);

        // validate required fields
        var missingFields = requiredFields.filter(function(field) {
          return !form[field].value;
        });

        if (missingFields.length) {
          missingFields.forEach(function(field) {
            $(form[field]).after("<span class='wdk-error'>This field is required</span>");
          });
          return;
        }

        // validation of email addresses
        if (ccAddrs.length > 10) {
          $("<div>You have entered more than 10 Cc addresses. " +
              "Please limit this to 10.</div>").dialog({
            title: "Oops! An error occurred.",
            buttons: [{
              text: "OK",
              click: function() { $(this).dialog("close"); }
            }],
            modal: true
          });
          return;
        }

        var badAddrs = $.grep(ccAddrs.concat(form.reply.value), function(addr) {
          emailRegex.test(addr);
        }, false);

        if (badAddrs.length > 0) {
          var list = $.map(badAddrs, function(addr) {
            return "<li>" + addr + "</li>";
          }).join("");
          $("<div></div>").html("<h3>The following email addresses appear to " +
              "be invalid.</h3><ul>" + list + "</ul>").dialog({
            title: "Oops! An error occurred.",
            buttons: [{
              text: "OK",
              click: function() { $(this).dialog("close"); }
            }],
            modal: true
          }).addClass("contact-us");
          return;
        }

        /*

         we will submit form using the browser's native submit since
         XHR can't handle file uploads

        wdk.util.sendContactRequest(form, function(data){
          // close containing dialog
          form.reset();
          $(form).parents("#wdk-dialog-contact-us").dialog("close");
          // open thank you dialog
            $("<div></div>").html(data.message).dialog({
              title: "Thank you!",
              buttons: [{
                text: "OK",
                click: function() {
                  $(this).dialog("close");
                  if (window.name == "wdk_window_contact_us") {
                    window.close();
                  }
                }
              }],
              modal: true
            });
        });

        */

        form.submit();

      });

    wdk.util.addSpamTimestamp($form);
  };

	// currently only used in ortho's sidebar.tag
  var configureSidebar = function() {
    $("#sidebar").accordion({
     active:1,                  // do not combine with navigation
     animate: 200,
     collapsible: false,
		 heightStyle: "content",
     icons:false
    });
  };

  var configureMenuBar = function() {
    var menu = document.getElementById('menu');
    var $body = $(document.body);
    var linkInMenu = false;
    var $topLink = $('<a class="back-to-top" href="#" title="Back to top of page">' +
                     '  <i class="fa fa-2x fa-arrow-circle-up"></i>' +
                     '</a>')
      .css({
        padding: '2px 1em',
        borderLeft: 'none'
      })
      .click(function(e) {
        e.preventDefault();
        e.target.blur();
        window.scrollTo(0, 0);
      });
    var $topLinkMenuItem = $('<li/>').append($topLink)
      .css({
        float: 'right',
      });
    var $lastMenuItem = $('> ul > li:last-child', menu);

    $('.sf-menu', menu).superfish();
    $(window).on('scroll', updateMenuBar);
    updateMenuBar();

    function updateMenuBar() {
      if (menu.getBoundingClientRect().top < 1) {
        if (linkInMenu) return;
        $body.addClass('fixed-menu');
        $topLinkMenuItem.insertBefore($lastMenuItem);
        linkInMenu = true;
      }
      else {
        if (!linkInMenu) return;
        $body.removeClass('fixed-menu');
        $topLinkMenuItem.detach();
        linkInMenu = false;
      }
    }
  };

  function siteAnnouncements($el) {
    render(createElement(Announcements, {
      projectId: wdk.MODEL_NAME,
      webAppUrl: wdk.webappUrl()
    }), $el[0]);
  }

  ns.setUpContactUsLogic = setUpContactUsLogic;
  ns.configureSidebar = configureSidebar;
  ns.configureMenuBar = configureMenuBar;
  ns.siteAnnouncements = siteAnnouncements;

});
