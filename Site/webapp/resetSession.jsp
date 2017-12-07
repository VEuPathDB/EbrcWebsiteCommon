<%@ taglib prefix="imp" tagdir="/WEB-INF/tags/imp" %>

<imp:pageFrame refer="help" title="Reset Session">
  <style>
    h1 {
      text-align: left;
    }
    button[disabled] {
      color: #999;
    }
    .innertube {
      margin: 6px auto;
      max-width: 1000px;
      font-size: 14px;
    }
    label[for="understand-reset"] {
      padding-right: 1em;
    }
    .spin-wrapper {
      width: 22px;
      position: relative;
      display: inline-block;
      top: -4px;
    }
  </style>

  <div>
    <h1>Reset Session</h1>
    <div>
      Clicking the following button will remove all cookies related to
      this website and redirect you to the homepage. This means the following
      things will happen:
      <ul>
        <li>If you are logged in, you will be logged out.</li>
        <li>If you are not logged in, any unsaved worked will be gone
          forever.</li>
      </ul>

      <input type="checkbox" id="understand-reset"/>
      <label for="understand-reset">I understand that I may lose work.</label>
      <button id="reset" is="reset-session" disabled>Reset session</button>
    </div>
  </div>

  <imp:script src="js/resetSession.js"/>

  <script>
    (function($) {
      var $resetButton = $('#reset');
      var $understandCheckbox = $('#understand-reset');

      $understandCheckbox.on('change', function() {
        $resetButton.prop('disabled', !$understandCheckbox.prop('checked'));
      });

      $resetButton
        .on('reset.session', function() {
          Wdk.Platform.alert(
            "Your session has been reset",
            "You will now be redirected to the home page."
          ).then(function() {
            window.location = wdk.webappUrl();
          });
        });

      $resetButton.prop('disabled', !$understandCheckbox.prop('checked'));
    }(jQuery));
  </script>
</imp:pageFrame>
