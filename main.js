// this file oversees and does window.on* stuff.


window.onmessage = function handle(evt) { // data, origin, source
  var data = evt.data;
  if (document.querySelector("iframe").src.indexOf("escape-artist/template.php") !== -1) {
    if (evt.source == frames[0]) {
      // we're good...kinda.
      if (typeof data == "string") { // MSIE9
        data = data.split(",");
      }
      if ((data instanceof Array) && (data.length == 2)) {
        //console.log("adding result.. " + data );
        var loc = evt.data[0];

        // info = btoa(["Filter", filterNo, "Template Part", tmplNo, "Vector", vector].join("|"));
        var info = data[1];
        var decoded = atob(info);
        decoded = decoded.split("|");
        var filterNo = decoded[1];
        var tmplNo = decoded[3];
        var vector = decoded[5];
        if (updateLog(info, "bypass") !== true) {
          addToLog(filterNo, tmplNo, vector, "bypass");
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
  document.querySelector("#contentFrame").addEventListener("load", FuzzRunner.nextTest);
  FuzzRunner.nextTest(); // the first iframe is already loaded. kick off first test manually.
}

var CONFIG = {
  host:  document.location.hostname || "localhost",
  path : document.location.pathname || "~freddy/escape-artist/",
  debug: false,
}