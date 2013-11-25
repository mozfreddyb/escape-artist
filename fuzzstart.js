var FuzzRunner = (function() {
  var runner = {};


//startup:
  var filterNo = 0;
  var tmplNo = 0;
  var tmplMax = 3;
  var tested = {}; // used as hashtable to find vectors already used
  var vector;
  function executeTest() {
    if (tmplNo == tmplMax) { // next filter, if done with all templates
      tmplNo = tmplNo % tmplMax;
      filterNo++;
    }
    if (filterNo >= filters.length) { // Next vector if done with all filters
      console.log("Done through all filters. Next Vector.");
      if (CONFIG.debug) { // debug, if we do not want to try vectors other than the first one.
        return;
      }

      filterNo = 0; tmplNo = 0;
      vector = Producer.getNewVector("CAP_EXECUTE_SCRIPT");
      console.log("New: "+ vector)
    }
    var filterFunc = filters[filterNo][0];
    var filteredVector = filterFunc(vector);

    if (CONFIG.debug) {
      console.log("Trying Vector: " + vector);
      console.log("Filtered: " + filteredVector);
    }
    //TODO test other thing than "just" script execution as a filter violation.

    if (typeof String.toSource !== "undefined") {
      // JSON.stringify is pretty cool, but toSource doesn't fuck up binary data in strings ;)
      frames[0].name = btoa(["Filter", filterNo, "Template Part", tmplNo, "Vector", vector.toSource()].join("|"));
    } else {
      frames[0].name = btoa(["Filter", filterNo, "Template Part", tmplNo, "Vector", JSON.stringify(vector)].join("|"));
    }
    try {
      frames[0].document.location = 'template.php?tid=' + tmplNo + '&input=' + encodeURIComponent(btoa(filteredVector));
      //TODO decide if this is only debug ---v
      document.querySelector("#debug").value = frames[0].document.body.innerHTML;
    } catch (e) {}
    //addToLog(filterNo, tmplNo, vector, "pending/safe");

    tmplNo++;
  }

  function start() {
    if (vector === undefined) {
      if (CONFIG.debug) {
        // "one vector to rule them all"
        vector = (new String("javascript:/*-->]]>%>?></script></title></textarea></noscript></style></xmp>\">[img=1,name=top.postMessage([window.location.href,window.name],/\\*/.source.slice(1))]<img -/style=a:expression&#40&#47&#42'/-/*&#39,/**/eval(name)/*%2A///*///&#41;;width:100%;height:100%;position:absolute;-ms-behavior:url(#default#time2) name=top.postMessage([window.location.href,window.name],/\\*/.source.slice(1)) onerror=eval(name) src=1 autofocus onfocus=eval(name) onclick=eval(name) onmouseover=eval(name) onbegin=eval(name) background=javascript:eval(name)//>\""))
      } else {
      vector = Producer.getNewVector("CAP_EXECUTE_SCRIPT");
      }
    }
    executeTest(vector);
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

  function addToLog(filterNo, tmplNo, Vector, status) {
    var tmplNames = ['in HTML', 'in an attribute', 'in a comment'];
    if (tmplNo < tmplNames.length) {
      tmplDesc = tmplNames[tmplNo];
    }
    // get function name. for IE we have to RegExp it out of the function source.
    var filterName = filters[filterNo][0].name || /function ([\S]+)\(.*/.exec(filters[filterNo][0])[1];

    var tr = document.createElement('TR');

    // Filter Name
    var td = document.createElement('TD');
    tr.appendChild(td);
    var text = document.createTextNode(filterName);
    td.appendChild(text);
    td.title = filters[filterNo][1];

    // Template description
    var td_0 = document.createElement('TD');
    tr.appendChild(td_0);
    var text_0 = document.createTextNode(tmplDesc);
    td_0.appendChild(text_0);

    // Vector as string
    var td_1 = document.createElement('TD');
    tr.appendChild(td_1);
    var pre = document.createElement('PRE')
    var text_1 = document.createTextNode(Vector);
    pre.appendChild(text_1)
    td_1.appendChild(pre);
    td_1.className = "vector";

    // Result
    var td_2 = document.createElement('TD');
    tr.appendChild(td_2);
    var text_2 = document.createTextNode(status);
    td_2.id = btoa(["Filter", filterNo, "Template Part", tmplNo, "Vector", vector].join("|"));
    td_2.className = "pending";
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

  function stahp() {
    nextTest = function() { };
  }

  runner.addToLog = addToLog;
  runner.updateLog = updateLog;
  runner.start = start;
  runner.stop = stahp; // ...
  return runner;
})();