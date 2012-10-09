
// defines all initial setup logic for Ortho pages not handled by WDK
// functions are called using onload-function 
var Setup = {
	
	setUpContactUsLogic: function() {
	    // submit Contact us via AJAX
	    $("body").on("submit", "#contact-us", function(e) {
	      e.preventDefault();
	      var form = this,
	          emailRegex = /^\S+@\S+$/,
	          ccAddrs = this.addCc.value.split(/,\s*(?=\w)/);
	
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
	
	      WdkAjax.sendContactRequest(form, function(data){
	    	  // close containing dialog
	    	  form.reset();
	    	  $(form).parents("#wdk-dialog-contact-us").dialog("close");
	    	  // open thank you dialog
	          $("<div></div>").html(data.message).dialog({
	            title: "Thank you!",
	            buttons: [{
	              text: "OK",
	              click: function() { $(this).dialog("close"); }
	            }],
	            modal: true
	          });
	      });
	    });
	},
	
	configureSidebar: function() {
		$("#sidebar").accordion({
			navigation: true,
		    icons:false
		});
	}
};