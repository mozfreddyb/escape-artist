var templateFuncs = [
  [function(s) {
    return "<img src=\"" + s + "\" />";
  }, "straight in HTML"],
  [function(s) {
    return "<!-- " + s + " -->";
  }, "img src attribute, double quoted"],
  [function(s) {
    return "<img src='" + s + "' />";
  }, "html comment"],
  [function(s) {
    return "<img src='" + s + "' />";
  }, "img src attribute, single-quoted"],
  [function(s) {
    return "<a title=" + s + " />#</a>";
  }, "A tag title attribute, unquoted"],

];