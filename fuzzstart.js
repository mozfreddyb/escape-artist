//startup:
var filterNo = 0;
var tmplNo = 0;
var tmplMax = 3;
var vector = exerciseCapability('CAP_EXECUTE_SCRIPT');
var vector = (new String("<img src=\"http://localhost/~freddy/escape-artist//samples/sample.gif\" onload=\"top.postMessage([ window.location.href, window.name ], '*');\">"));
var results=[];

function nextTest() {

  if (tmplNo == tmplMax) {
    tmplNo = tmplNo % tmplMax;
    filterNo++;
  }
  if (filterNo >= filters.length) {
    console.log("Done");
    return;
  }
  var filterFunc = filters[filterNo];

  var tmplVar = "{{var" + tmplNo + "}}";
  var input = filterFunc(vector);

  console.log("Trying Vector: " + vector);
  console.log("Filtered: " + input);
  //TODO test other thing than "just" script execution as a filter violation.

  frames[0].name = btoa(["Filter", filters[filterNo].name, "Template Part", tmplNo, "Vector", vector].join("|"));
  try {
    frames[0].document.body.innerHTML = frames[0].document.body.innerHTML.replace(tmplVar, input);
    document.querySelector("#debug").value = frames[0].document.body.innerHTML;
  } catch (e) {}
  //setTimeout(triggerNext, 500);
  tmplNo++;
}
function triggerNext() {
  frames[0].location.reload()
}

function addResult(filterName, tmplNo, Vector) {
  var tmplNames = ['in HTML', 'in an attribute', 'in a comment'];
  if (tmplNo < tmplNames.length) {
    tmplNo = tmplNames[tmplNo];
  }
  var tr = document.createElement('TR');
  var td = document.createElement('TD');
  tr.appendChild(td);
  var text = document.createTextNode(filterName);
  td.appendChild(text);
  var td_0 = document.createElement('TD');
  tr.appendChild(td_0);
  var text_0 = document.createTextNode(tmplNo);
  td_0.appendChild(text_0);
  var td_1 = document.createElement('TD');
  tr.appendChild(td_1);
  var pre = document.createElement('PRE')

  var text_1 = document.createTextNode(vector);
  pre.appendChild(text_1)
  td_1.appendChild(pre);

  var table = document.querySelector("#resultTable");
  table.appendChild(tr);
}


window.onmessage = function handle(evt) { // data, origin, source
  if (document.querySelector("iframe").src.endsWith("escape-artist/template.html")) {
    if (evt.source == frames[0]) {
      // we're good...kinda.
      if ((evt.data instanceof Array) && (evt.data.length == 2)) {
        console.log("adding result.. " + evt.data );
        var loc = evt.data[0];

        // info = btoa(["Filter", filterNo, "Template Part", tmplNo, "Vector", vector].join("|"));
        var info = evt.data[1];
        var decoded = atob(info);
        decoded = decoded.split("|");
        var filterName = decoded[1];
        var tmplNo = decoded[3];
        var vector = decoded[5];
        addResult(filterName, tmplNo, vector);

        //console.log(evt.data)
      }

    }
  }
}

window.onload = function() {
  document.querySelector("#nextButton").addEventListener("click", triggerNext);
}