var filters = [
  function nullFilter(s) {
    // do not filter
    return s;
  },
  function first50(s) {
    // strips after 50 characters
    return s.substring(0, 50)
  },
  function first100(s) {
    // strips after 100 characters
    return s.substring(0, 100)
  },

  function use_escape(s) {
    // use built-in escape
    return escape(s);
  },
  function urlencode(s) {
    // use encodeURIComponent
    return encodeURIComponent(s);
  },
  function replaceQuotesandAngles(s) {
    return s.replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#27;");
  },
  function stripQuotesandAngles(s) {
    return s.replace(/>/g, "").replace(/</g, "").replace(/"/g, "").replace(/'/g, "");
  },

];