var templates = [
  [function(s) {
    return s;
  }, "straight in HTML"],
  [function(s) {
    return "<!-- " + s + " -->";
  }, "img src attribute, double quoted"],
  [function(s) {
    return "<!-- " + s + "'-->";
  }, "html comment"],
  [function(s) {
    return "<img src='" + s + "' />";
  }, "img src attribute, single-quoted"],
  [function(s) {
    return "<a title=" + s + " />#</a>";
  }, "A tag title attribute, unquoted"],

];