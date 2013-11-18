var filters = [
  /* [function nullFilter(s) {
    return s;
  }, "Does not filter"],
  [function first50(s) {
    return s.substring(0, 50)
  }, "Strips after 50 Characters"],
  [function first100(s) {
    return s.substring(0, 100)
  }, "Strips after 100 Characters"], */
  [function use_escape(s) {
    return escape(s);
  }, "uses JavaScript escape()"],
  [function urlencode(s) {
    return encodeURIComponent(s);
  }, "uses encodeURIComponent"],
  [function replaceAngles(s) {
    return s.replace(/>/g, "&gt;").replace(/</g, "&lt;");
  }, "Replaces < and > with entities"],
  [function stripAngles(s) {
    return s.replace(/>/g, "").replace(/</g, "");
  }, "Strips < and >"],
  [function replaceAnglesandDoubleQuote(s) {
    return s.replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }, "Replaces < and > with entities"],
  [function stripAnglesandDoubleQuote(s) {
    return s.replace(/>/g, "").replace(/</g, "").replace(/"/g, "");
  }, "Strips < and >"],
  [function replaceQuotesandAngles(s) {
    return s.replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#27;");
  }, "Replaces <,> ' and \" with entities"],
  [function stripQuotesandAngles(s) {
    return s.replace(/>/g, "").replace(/</g, "").replace(/"/g, "").replace(/'/g, "");
  }, "Strips <,> ' and \""],

];