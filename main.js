// this file oversees and does window.on* stuff.
window.onmessage = function handle(evt) { // data, origin, source
  var data = evt.data;
    if (evt.source == frames[0]) {
      if (typeof data === "string") {
        var info = data;
        var decoded = atob(info);
        decoded = decoded.split("|");
        var filterNo = decoded[1];
        var tmplNo = decoded[3];
        var vector = JSON.stringify(decoded[5]);
        if (FuzzRunner.updateLog(info, "bypass") !== true) {
          FuzzRunner.addToLog(filterNo, tmplNo, vector, "bypass");
        }
      }

    }
}


function hideToggle() {
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
  FuzzRunner.started = +(new Date()); // global
  document.querySelector("#stopButton").addEventListener("click", function() { FuzzRunner.nextTest = function() { }; });
  document.querySelector("#nextButton").addEventListener("click", FuzzRunner.nextTest);
  document.querySelector("#toggleVisibility").addEventListener("click", hideToggle);
  document.querySelector("#contentFrame").addEventListener("load", function() { setTimeout(FuzzRunner.nextTest, 0); } ); // wait a bit for debugging..
  // the first iframe is already loaded. kick off first test manually.
  // wait a sec, then load :) (required because producer caches things..)
  setTimeout(FuzzRunner.nextTest, 500);
}

var CONFIG = {
  host:  document.location.hostname || "localhost",
  path : document.location.pathname || "~freddy/escape-artist/",
  debug: (location.hash.indexOf('debug') != -1) || (location.search.indexOf('debug') !== -1) ? true : false,
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