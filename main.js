// this file oversees and does window.on* stuff.


window.onmessage = function handle(evt) { // data, origin, source
  var data = evt.data;
  if (document.querySelector("iframe").src.indexOf("escape-artist/template.php") !== -1) {
    if (evt.source == frames[0]) {
      // we're good...kinda.
      //if (typeof data == "string") { // MSIE9
      //  data = data.split(",");
      //}
      if (typeof data === "string") {
        //console.log("adding result.. " + data );
        //var loc = evt.data;

        // info = btoa(["Filter", filterNo, "Template Part", tmplNo, "Vector", vector].join("|"));
        var info = data;
        var decoded = atob(info);
        decoded = decoded.split("|");
        var filterNo = decoded[1];
        var tmplNo = decoded[3];
        var vector = decoded[5];
        if (FuzzRunner.updateLog(info, "bypass") !== true) {
          FuzzRunner.addToLog(filterNo, tmplNo, vector, "bypass");
        }

        //console.log(evt.data)
      }

    }
  }
}


function hideTests() {
  /* toggle hiding
   <iframe id="contentFrame" onload="executeTest();" src="template.html"></iframe><br>
   <textarea id="debug" style="width: 480px; height: 240px;"></textarea><br>
   */
  try {
    if ((document.getElementById("contentFrame").style.display == "") || (document.getElementById("contentFrame").style.display == "block")) {
      document.getElementById("contentFrame").style.display = "none";
      document.getElementById("debug").style.display = "none";
    } else {
      document.getElementById("contentFrame").style.display = "block";
      document.getElementById("debug").style.display = "block";
    }
  } catch(e) { }; // lazy
}


window.onload = function() {
  document.querySelector("#nextButton").addEventListener("click", FuzzRunner.stahp);
  document.querySelector("#toggleVisibility").addEventListener("click", hideTests);
  document.querySelector("#contentFrame").addEventListener("load", function() { setTimeout(FuzzRunner.start, 150); } ); // wait a bit for debugging..
  // the first iframe is already loaded. kick off first test manually.
  // wait a sec, then load :) (required because producer caches things..)
  setTimeout(FuzzRunner.start, 500);
}

var CONFIG = {
  host:  document.location.hostname || "localhost",
  path : document.location.pathname || "~freddy/escape-artist/",
  debug: false,
  res: {
    // Type: content-type, either type/subtype or just type, not "type/*".
      'text/html': 'samples/sample.html',
      'text/plain': 'samples/sample.txt',
      'text/javascript': 'samples/sample.js',
      'text/css': 'samples/sample.css',
      'application/font-woff': 'samples/brankovic.ttf',
      // images
      'image/svg+xml': 'samples/sample.svg',
      'image/gif':'samples/sample.gif',
      'image/jpeg': 'samples/sample.jpg', // ??
      'image/jpg': 'samples/sample.jpg',
      'image/png': 'samples/sample.png',
      'video/mp4': 'samples/video.mp4',
      'video/ogg': 'samples/video.ogv',
      'audio/mpeg': 'samples/audio.mp3',
      'audio/ogg': 'samples/audio.ogg',
      // more to follow... :)
      /* suggestions:
       application/xml, jar (application/x-compressed,application/java-archivemime-type)
       */
    },
}
Producer = ProducerModule();