// There are time when a user's session becomes corrupted. The following
// provides a convenient way to allow a user to remove session cookies.
//
//
// USAGE:
//
// Use the `is` attribute on a button element:
//
//     <button is="reset-session">Reset browser session</button>
//
// When all cookies have been removed, the event 'reset.session'
// will be triggered.

(function($) {

  function deleteCookies(path) {
    document.cookie.split(/\s*;\s*/)
      .forEach(function(cookie) {
        var eqPos = cookie.indexOf('=');
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        var cookieValue = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';

        if (path) {
          cookieValue += ';path=' + path;
        }

        document.cookie = cookieValue;
      });
  }

  function resetSession() {
    deleteCookies('/');
    deleteCookies(wdk.webappUrl().slice(0, -1));
    deleteCookies('/cgi-bin/');
  }

  function isResetSession() {
    return this.on('click', function(e) {
      e.preventDefault();
      resetSession();
      this.trigger('reset.session');
    }.bind(this));
  }

  $.fn.isResetSession = isResetSession;

  $('button[is="reset-session"]').isResetSession();

}(jQuery));
