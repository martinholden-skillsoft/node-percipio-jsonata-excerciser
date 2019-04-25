/* eslint-disable */
/**
 * © Copyright IBM Corp. 2016, 2017 All Rights Reserved
 *   Project name: JSONata
 *   This project is licensed under the MIT License, see LICENSE
 */

var moment;
if (!window) {
  require('./cm-jsonata.js');
}
let errorMark;
let jsonataResult;
let jsonataError;

window.onload = function() {
  default_text = document.getElementById('source').value || '';

  source = CodeMirror.fromTextArea(document.getElementById('source'), {
    mode: { name: 'javascript', json: true },
    lineNumbers: true
  });

  path = CodeMirror.fromTextArea(document.getElementById('path'), {
    mode: { name: 'jsonata', jsonata: window.jsonata, template: false },
    autoCloseBrackets: {
      pairs: '()[]{}',
      triples: '',
      explode: '[]{}()'
    },
    matchBrackets: true,
    extraKeys: {
      F11: function(cm) {
        // F11 shortcut for lambda λ
        cm.replaceSelection('\u03BB');
      }
    },
    viewportMargin: Infinity
  });

  //data1();

  var timer;

  source.on('change', function() {
    clearTimeout(timer);
    timer = setTimeout(evaluateChanges, 500);
  });

  path.on('change', function() {
    clearTimeout(timer);
    timer = setTimeout(evaluateChanges, 500);
  });

  result = CodeMirror.fromTextArea(document.getElementById('result'), {
    mode: { name: 'javascript', json: true },
    readOnly: true
  });

  timer = setTimeout(evaluateChanges, 500);

  document.getElementById('json-format').onclick = function() {
    var str = source.getValue();
    str = JSON.parse(str);
    str = JSON.stringify(str, null, 2);
    source.setValue(str);
  };

  window.selectData = function(selection) {
    return getSampleData(selection.value);
  };

  window.selectTransform = function(selection) {
    return getTransform(selection.value);
  };

  $(window).on('hashchange', function(e) {
    window.history.pushState('', document.title, window.location.pathname);
  });
};

function evaluateChanges() {
  var str;
  jsonataResult = undefined;
  jsonataError = undefined;

  try {
    str = source.getValue();
    str = JSON.parse(str);
  } catch (err) {
    console.log(err);
    result.setOption('mode', 'text/plain');
    result.setValue('ERROR IN INPUT DATA: ' + err.message);
    return;
  }
  //console.log(str);

  var pth = path.getValue();
  console.log(pth);

  if (errorMark) {
    errorMark.clear();
    errorMark = undefined;
  }

  try {
    if (pth !== '') {
      path.setOption('mode', { name: 'jsonata', jsonata: window.jsonata });
      jsonataResult = evalJsonata(str);

      result.setOption('mode', 'javascript');
      result.setValue(jsonataResult);
    }
  } catch (err) {
    jsonataError = err;
    result.setOption('mode', 'text/plain');
    result.setValue(err.message || String(err));
    console.log(err);
    errorMark = path.markText(
      { line: 0, ch: err.position - 1 },
      { line: 0, ch: err.position },
      { css: 'background-color: pink' }
    );
  }
}

/**
 * Protect the process/browser from a runnaway expression
 * i.e. Infinite loop (tail recursion), or excessive stack growth
 *
 * @param {Object} expr - expression to protect
 * @param {Number} timeout - max time in ms
 * @param {Number} maxDepth - max stack depth
 */
function timeboxExpression(expr, timeout, maxDepth) {
  var depth = 0;
  var time = Date.now();

  var checkRunnaway = function() {
    if (depth > maxDepth) {
      // stack too deep
      throw {
        code: 'U1001',
        message:
          'Stack overflow error: Check for non-terminating recursive function.  Consider rewriting as tail-recursive.',
        stack: new Error().stack
      };
    }
    if (Date.now() - time > timeout) {
      // expression has run for too long
      throw {
        code: 'U1002',
        message: 'Expression evaluation timeout: Check for infinite loop',
        stack: new Error().stack
      };
    }
  };

  // register callbacks
  expr.assign('__evaluate_entry', function(expr, input, environment) {
    depth++;
    checkRunnaway();
  });
  expr.assign('__evaluate_exit', function(expr, input, environment, result) {
    depth--;
    checkRunnaway();
  });
}

function evalJsonata(input) {
  var expr = window.jsonata(path.getValue());

  if (!this.local) {
    timeboxExpression(expr, 1000, 500);
  }

  var pathresult = expr.evaluate(input);
  if (typeof pathresult === 'undefined') {
    pathresult = '** no match **';
  } else {
    pathresult = JSON.stringify(
      pathresult,
      function(key, val) {
        return typeof val !== 'undefined' && val !== null && val.toPrecision
          ? Number(val.toPrecision(13))
          : val && (val._jsonata_lambda === true || val._jsonata_function === true)
          ? '{function:' + (val.signature ? val.signature.definition : '') + '}'
          : typeof val === 'function'
          ? '<native function>#' + val.length
          : val;
      },
      2
    );
  }
  return pathresult;
}

function getSampleData(dataType) {
  $.ajax({
    type: 'GET',
    url: '/exampledata/' + dataType + '.json',
    contentType: 'application/json',
    success: function(data, status, jqXHR) {
      if (jqXHR.status === 200) {
        source.setValue(JSON.stringify(data, null, 2));
        //getTransform(dataType);

        //$("#sample-transform").val(dataType);
      }
    }
  });
}

function getTransform(transformType) {
  $.ajax({
    type: 'GET',
    url: '/exampletransform/' + transformType + '.jsonata',
    contentType: 'application/json',
    success: function(data, status, jqXHR) {
      if (jqXHR.status === 200) {
        path.setValue(data);
      }
    }
  });
}
