//startup:
var filterNo = 0;
var tmplNo = 0;
var tmplMax = 3;
var vector = exerciseCapability('CAP_EXECUTE_SCRIPT');
var vector = (new String("<img src=\"http://localhost/~freddy/escape-artist//samples/sample.gif\" onload=\"top.postMessage([ window.location.href, window.name ], '*');\">"));

function nextTest() {

  if (tmplNo == tmplMax) {
    tmplNo = tmplNo % tmplMax;
    filterNo++;
  }
  if (filterNo >= filters.length) {

    filterNo = 0; tmplNo = 0;
    vector = exerciseCapability('CAP_EXECUTE_SCRIPT');
    //console.log("Done");
    //return;
  }
  var filterFunc = filters[filterNo][0];

  var tmplVar = "{{var" + tmplNo + "}}";
  var input = filterFunc(vector);

  console.log("Trying Vector: " + vector);
  console.log("Filtered: " + input);
  //TODO test other thing than "just" script execution as a filter violation.

  frames[0].name = btoa(["Filter", filterNo, "Template Part", tmplNo, "Vector", vector].join("|"));
  try {
    frames[0].document.body.innerHTML = frames[0].document.body.innerHTML.replace(tmplVar, input);
    document.querySelector("#debug").value = frames[0].document.body.innerHTML;
  } catch (e) {}
  //addToLog(filterNo, tmplNo, vector, "pending/safe");
  setTimeout(triggerNext, 100);
  tmplNo++;
}

function addToLog(filterNo, tmplNo, Vector, status) {
  var tmplNames = ['in HTML', 'in an attribute', 'in a comment'];
  if (tmplNo < tmplNames.length) {
    tmplDesc = tmplNames[tmplNo];
  }
  var filterName = filters[filterNo][0].name;
  var tr = document.createElement('TR');

  var td = document.createElement('TD');
  tr.appendChild(td);
  var text = document.createTextNode(filterName);
  td.appendChild(text);
  td.title = filters[filterNo][1];

  var td_0 = document.createElement('TD');
  tr.appendChild(td_0);
  var text_0 = document.createTextNode(tmplDesc);
  td_0.appendChild(text_0);

  var td_1 = document.createElement('TD');
  tr.appendChild(td_1);
  var pre = document.createElement('PRE')
  var text_1 = document.createTextNode(Vector);
  pre.appendChild(text_1)
  td_1.appendChild(pre);
  td_1.className = "vector";

  var td_2 = document.createElement('TD');
  tr.appendChild(td_2);
  var text_2 = document.createTextNode(status);
  td_2.id = btoa(["Filter", filterNo, "Template Part", tmplNo, "Vector", vector].join("|"));
  td_2.className = "pending"
  td_2.appendChild(text_2);

  var table = document.querySelector("#resultTable");
  table.appendChild(tr);
}
function updateLog(info, status) {
  try {
    var td = document.getElementById(info);
    td.textContent = status;
    td.className = (status == "bypass") ? "bypass" : "safe";
    return true;
  }
  catch(e) { return false; }
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

window.onload = function() {
  document.querySelector("#nextButton").addEventListener("click", stahp);
}

function triggerNext() {
  frames[0].location.reload()
}

function stahp() {
  nextTest = function() { };
}
