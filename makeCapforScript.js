// given a vector (below from html5sec cheat sheet), we deduce a syntax and express it as a JS object
// i.e. {'tagName': 'img', 'attributes': {'src': 'x', 'onerror': ['X-payload', 'text/javascript']} },

var vectors = [
  {
    "data": "<input onfocus=write(1) autofocus>",
    "sanitized": "<html><head></head><body></body></html>"
  },
  {
    "data": "<input onblur=write(1) autofocus><input autofocus>",
    "sanitized": "<html><head></head><body></body></html>"
  },
  {
    "data": "<a style=\"-o-link:'javascript:alert(1)';-o-link-source:current\">X</a>",
    "sanitized": "<html><head></head><body><a>X</a></body></html>"
  },
  {
    "data": "<video poster=javascript:alert(1)//></video>",
    "sanitized": "<html><head></head><body><video controls=\"controls\" poster=\"javascript:alert(1)//\"></video></body></html>"
  },
  {
    "data": "<svg onload=\"javascript:alert(1)\"></svg>",
    "sanitized": "<html><head></head><body></body></html>"
  },
  {

    "data": "<script>({0:#0=alert/#0#/#0#(0)})</script>",
    "sanitized": "<html><head></head><body></body></html>"
  },
  {
    "data": "X<x style=`behavior:url(#default#time2)` onbegin=`write(1)` >",
    "sanitized": "<html><head></head><body>X</body></html>"
  },
  {
    "data": "<?xml-stylesheet href=\"javascript:alert(1)\"?><root/>",
    "sanitized": "<html><head></head><body></body></html>"
  },
  {
    "data": "<link rel=stylesheet href=data:,*%7bx:expression(write(1))%7d",
    "sanitized": "<html><head></head><body></body></html>"
  },
  {
    "data": "<style>@import \"data:,*%7bx:expression(write(1))%7D\";</style>",
    "sanitized": "<html><head></head><body></body></html>"
  },
  {
    "data": "<frameset onload=alert(1)>",
    "sanitized": "<html><head></head></html>"
  },
  {
    "data": "<table background=\"javascript:alert(1)\"></table>",
    "sanitized": "<html><head></head><body><table></table></body></html>"
  },
  {
    "data": "1<vmlframe xmlns=urn:schemas-microsoft-com:vml style=behavior:url(#default#vml);position:absolute;width:100%;height:100% src=test.vml#xss></vmlframe>",
    "sanitized": "<html><head></head><body>1</body></html>"
  },
  {
    "data": "<a style=\"behavior:url(#default#AnchorClick);\" folder=\"javascript:alert(1)\">XXX</a>",
    "sanitized": "<html><head></head><body><a>XXX</a></body></html>"
  },
  {
    "data": "<object data=\"data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==\"></object>",
    "sanitized": "<html><head></head><body></body></html>"
  },
  {
    "data": "<embed src=\"data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==\"></embed>",
    "sanitized": "<html><head></head><body></body></html>"
  },
]

function makeCap(s) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(s, "text/html");                                                                           /
  var payload;
  if (doc.head.innerHTML != "") {
    var payload = 'head'
  }
  else {
    var payload = 'body';
  }

  var domtree = doc[payload];
  var el = domtree.children[0];
  var tagName = el.tagName;
  var attributes = {}
  for (var i=0; i < el.attributes.length; i++) {
    var att = el.attributes[i];
    attributes[att.name] = att.value;
  }
  var content = el.innerHTML;
  cap = {tagName: tagName, attributes: attributes, content: content };
  return JSON.stringify(cap);


}

for (var vector in vectors) {
  console.log(makeCap(vectors[vector].data));

}

