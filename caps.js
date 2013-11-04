CONFIG_HOST= document.location.hostname || "localhost";
CONFIG_PATH = document.location.pathname || "~freddy/escape-artist/";

var caps = {
  /* a dictionary of capability names and examples to exercise them.
     to exercise a cap we require a html construct of the following form:
         tagName: of course, the name of the html tag
         attributes: a dict of key/value pairs
         content: content between the opening and the closing tag.

         filling attribute values or content can be done by giving a pair of typeExample and an optional type (not required)
         in the form as a array with the length of two.
         content-types can be either type/subtype or just type (e.g. "image" or "image/gif", but not "image/*").

   */
//  'Ø': [], // this looks way sexier than a zero
  'CAP_INCLUDE_PAGE': [{'tagName': 'iframe', 'attributes': {'src': ['X-url', '']} } ], // the most powerful you can get...descending from here
  'CAP_EXECUTE_SCRIPT': [
    {'tagName': 'script', 'attributes': {}, 'content': ['X-payload', 'text/javascript']},
    {'tagName': 'script', 'attributes': {'src': ['X-url', 'text/javascript']} },
    {'tagName': 'img', 'attributes': {'src': ['X-url', 'image'], 'onload': ['X-payload', 'text/javascript']} },
    {'tagName': 'img', 'attributes': {'src': 'x', 'onerror': ['X-payload', 'text/javascript']} },
    {"tagName": "frameset", "attributes": {'onload': ['X-payload', 'text/javascript'] } },
    {"tagName": "input", "attributes": {"autofocus": "", "onfocus": ['X-payload', 'text/javascript']}}, //TODO make autofocus thing work
    {"tagName": "svg", "attributes": {"onload": ['X-payload', 'text/javascript']}},
    {"tagName": "table", "attributes": {"background": ['X-url', 'text/javascript']}},
    {"tagName": "A", "attributes": {"folder": ['X-url', 'text/javascript'],"style": "behavior:url(#default#AnchorClick);"}, "content": ['X-payload','text']},
    {"tagName": "object", "attributes": {"data":['X-url', 'text/javascript']}},
    {"tagName": "embed", "attributes": {"src":['X-url', 'text/javascript']} },
    /*TODO
    replacing in attribute value :<
    {"tagName":"A","attributes":{"style":"-o-link:'javascript:alert(1)';-o-link-source:current"},"content":"X"},
    {"tagName":"STYLE","attributes":{},"content":"@import \"data:,*%7bx:expression(write(1))%7D\";"},
    */
  ],
  //TODO how to nest tags? e.g. <form id="test"></form><button form="test" formaction="javascript:alert(1)">X</button>

  'CAP_APPLY_STYLE': [{'tagName': 'span', 'attributes': {'style': ['X-payload', 'text/css'] } },
    {'tagName': 'style', 'attributes': {'type': 'text/css'}, 'content': ['X-payload', 'text/css'] },
    {'tagName': 'style', 'attributes': {'type': 'text/css', 'src': ['X-url', 'text/css']} }
    ],
  'CAP_MEDIA_IMAGE': [{'tagName': 'img', 'attributes': {'src': ['X-url', 'image']} } ],
  'CAP_MEDIA_AUDIO': [{'tagName': 'audio', 'attributes': {'autoplay': 'true', 'src': ['X-url', 'audio']} } ],
  'CAP_MEDIA_VIDEO': [{'tagName': 'video', 'attributes': {'autoplay': 'true', 'src': ['X-url', 'video']} } ],
  'CAP_SHOW_PAGE': [{'tagName': 'iframe', 'attributes': {'src': ['X-url', ''], 'sandbox': ''} } ],
   'CAP_TRIGGER_REQUEST': [
     {'tagName': 'link', 'attributes': {'rel':'prefetch', 'href': ['X-url', '']}, 'content':''} // prefetching
   ],
  'CAP_TRIGGER_DNS': [
    {'tagName': 'link', 'attributes': {'rel':'dns-prefetch', 'href': ['X-url', '']}, 'content':''} // dns-prefetching
  ],
  //TODO this cap requires our x-url/x-payload resolution function to replace the tag but not the whole attribute/content
  //'CAP_CHANGE_PAGE': [
  //  {'tagName': 'meta', 'attributes': {'http-requiv': 'refresh', 'content': '0; url=X-url'}}
  //]

  //XXX how do I (logically) get fonts in here? they are a subset of styles... :/
  // example: @font-face { font-family: Brankovic;     src: url('samples/brankovic.ttf');
  // several formats (ttf, woff, eot !?) , see e.g. http://fonts.googleapis.com/css?family=Londrina+Shadow
}
//caps['MIN'] = caps['Ø'];
/* most other capabilities are somewhere in-between, since this is really hard to state fine-grained, I might not
 * be able to express this as a POSET :(
 * (see https://en.wikipedia.org/wiki/Partially_ordered_set)
*/
caps['MAX'] = caps['CAP_INCLUDE_PAGE'];


function typeToPath(resType) {
  // Category: payload (real content) or a url.
  // Type: content-type, either type/subtype or just type, not "type/*".
  var res = {
    'text/html': 'samples/sample.html',
    'text/html': 'samples/sample.txt',
    'text/javascript': 'samples/sample.js',
    'text/css': 'samples/sample.css',
    'application/font-woff': 'samples/brankovic.ttf',
    // images
    'image/svg+xml': 'samples/sample.svg',
    'image/gif':'samples/sample.gif',
    'image/jpeg': 'samples/samples.jpg', // ??
    'image/jpg': 'samples/samples.jpg',
    'image/png': 'samples/sample.png',
    'video/mp4': 'samples/sample.mp4',
    'video/ogg': 'samples/sample.ogv',
    'audio/mpeg': 'samples/sample.mp3',
    'audio/ogg': 'samples/sample.ogg',
      // more to follow... :)
    /* suggestions:
        application/xml, jar (application/x-compressed,application/java-archivemime-type)
     */
  };
  if (resType == '') {
    // most capable or random? :/
    return res[choice(Object.keys(res))]; //res['text/html'];
  }
  if (resType.indexOf("/") == -1) { // have to search through keys... most capable or random? tricky :<
       var list = []
       for (var key in res) {
        var majorType = key.split("/")[0];
        if (majorType.indexOf(resType) == 0) {
          list.push(res[key]);
        }
      }
      return choice(list); // random.
    }
   else if (resType in res) { return res[resType]; }
   else { throw new Error("There was no resource found to satisfy this content type:" + resType); }
}



/* XXXXXXXXXXXXXXXXXXX

 // for attributes that require a piece of text:,
 res['attribute-payload'] = {
 'text/javascript': 'alert(1)',
 // this has to be something we can monitor, so url() should make us see the request
 'text/css': "box-shadow: 0 0 20px black, 20px 15px 30px yellow, -20px 15px 30px lime, -20px -15px 30px blue, 20px -15px 30px red; " +
 "background-image: url(" + typeExamples[attribute-url['image/gif']] + " );",
 }

 * */


function makeURL(contenttype) {
  URL_LAYERS = {
    /**
     * functions(url,type,resolve):
     * url = string of the url,
     * type = content-type string like "text/html",
     * resolve = a method that allows the content of the url to be fetched (data urls require the content to be there, not pointed at :)),
     */
    'javascript': function(path, type) {
      // falling back to HTTP if type is not text/js
      if (type !== 'text/javascript') { return URL_LAYERS['http'](path, type); }
      return 'javascript:' + makePayload(path);
    },
    'data:': function(path, type) { return 'data:' +type+ ',' + makePayload(path);  },
    'data-base64': function(path, type) { return 'data:' +type+ ';base64,' + btoa(makePayload(path));  },
    'http': function(path, type) { return 'http://' + CONFIG_HOST + '/' + CONFIG_PATH + '/' + path;  },
    ///TODO add https
  }
  URL_LAYERS['feed'] =  function(path, type) { return 'feed:' + URL_LAYERS['http'](path); };
  URL_LAYERS['pcast'] = function(path, type) { return 'pcast:' + URL_LAYERS['http'](path); },
  URL_LAYERS['view-source'] = function(path, type) { return 'view-source:' + URL_LAYERS['http'](path);  } ;

  var path = typeToPath(contenttype)

  //TODO revisit randomly chosen urls
  //return URL_LAYERS['http'](path, contenttype);
  return URL_LAYERS[choice(Object.keys(URL_LAYERS))](path, contenttype);
}
function makePayload(path) {
  if (typeof require !== "undefined") {
    var fs = require("fs");
    return fs.readFileSync(path);
  } else {
    var xhr = new XMLHttpRequest();
    var result;
    xhr.open("GET", path, false);
    xhr.onload = function() { result = xhr.response };
    xhr.send();
    // we can safely return here because this XHR is not async :P
    return result;


  }
}
function resolveResource(arr) {
  var resMethod = arr[0];
  var typ = arr[1];
  //console.log("resolving via " + resMethod + '('+typ+')')
  if (resMethod == "X-url") {
    return makeURL(typ)
  }
  else if (resMethod == "X-payload") {
    var path = typeToPath(typ);
    return makePayload(path);
  }
}

function choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function capCodeToHTML(cc) {
  //console.log("Generating " + cc['tagName'] + " tag.");
  var tag = '<' + cc['tagName'];
  for (var att in cc['attributes']) {
    var attVal = cc['attributes'][att];
    if (typeof attVal != "string") {         // resolve X-url, X-payload directive
      attVal = resolveResource(attVal);

    }
    tag += ' '+ att + '="' + attVal + '"'; // concat with somethling like  src="srcVal"
  }
  tag += '>';
  if ('content' in cc) {
    if (typeof cc['content'] != "string") {
       cc['content'] = resolveResource(cc['content']);
    }

    tag += cc['content'];
  }
  tag += '</' + cc['tagName'] +'>'
  return tag

}



function exerciseCapability(cap) {
  if (!(cap in caps)) {
    throw new Error("Capability is not defined")
  }
  var capCode = choice(caps[cap]); // randomly pick one
  return capCodeToHTML(capCode);
}


function exerciseRandomCapability() {
  var cap_name = choice(Object.keys(caps));
  console.log("Generating a sample for " + cap_name);
  console.log(exerciseCapability(cap_name));
}