// VITEXTBI: A texts classifier & generator
// Author: Rafael Aznar (rafaaznar {at} gmail {dot} com)
// March 2020
// MIT License

var myModule = angular.module("myVitextbiAngularApp", []);

var myDirective = myModule.directive("filesInput", function () {
  return {
    require: "ngModel",
    link: function postLink(scope, elem, attrs, ngModel) {
      elem.on("change", function (e) {
        var files = elem[0].files;
        ngModel.$setViewValue(files);
      })
    }
  }
});

var myFilter = myModule.filter('clipstring', function ($filter) {
  return function (input) {
    if (input == null) {
      return "";
    }
    if (input.length > 40) {
      return input.substr(0, 30).trim() + " ...";
    } else {
      return input;
    }
  };
})

var myController = myModule.controller("myVitextbiController", [
  "$scope",
  function ($scope) {

    $scope.reset = function () {
      $scope.textFileContents = [];
      $scope.testFileContents = [];
      $scope.fTableFileContents = [];
      $scope.generatedText = "";
      $scope.status = 'initial'; // initial others
      $scope.range1 = 1;
      $scope.range2 = 1;
      $scope.checkboxCharWord = "C";
    }

    $scope.reset();

    $scope.clear = function () {
      angular.element(document.querySelector("input[type='file']")).val(null);
    };

    $scope.clearGeneratedText = function () {
      $scope.generatedText = "";
    }

    function checkInitial() {
      if ($scope.textFileContents.length == 0 && $scope.fTableFileContents.length == 0 && $scope.testFileContents.length == 0) {
        $scope.status = 'initial';
      }
    }

    //--

    $scope.removeTextFromLoadedTexts = function (index) {
      $scope.textFileContents.splice(index, 1);
      checkInitial()
    }
    $scope.removeFTableFromText = function (index) {
      $scope.textFileContents[index].aTable = null;
      $scope.textFileContents[index].fTable = null;
    }

    $scope.removeFtableFromFTables = function (index) {
      $scope.fTableFileContents.splice(index, 1);
      checkInitial()
    }

    $scope.removeTestText = function (index) {
      $scope.testFileContents.splice(index, 1);
      checkInitial()
    }

    //--
    $scope.buildTable = function (index, code) {
      $scope.textFileContents[index].aTable = null;
      $scope.textFileContents[index].fTable = null;
      var num1 = parseInt(code.charAt(1));
      var num2 = parseInt(code.charAt(2));
      if (code.charAt(0) == 'C') {
        var f01 = function (str, i) { return fc(str, i, 0, num1) };           // old notation pre-ES6...
        var f02 = function (str, i) { return fc(str, i, num1, num1 + num2) };
        $scope.textFileContents[index].aTable = buildAsoluteGraphOrderC($scope.textFileContents[index].textContent, [[code]], num1 + num2 - 1, f01, f02);
      } else {
        var f01 = function (str, i) { return fw(str, i, 0, num1) };
        var f02 = function (str, i) { return fw(str, i, num1, num1 + num2) };
        $scope.textFileContents[index].aTable = buildAsoluteGraphOrderW($scope.textFileContents[index].textContent, [[code]], num1 + num2 - 1, f01, f02);
      }
      $scope.textFileContents[index].fTable = buildFrequencyTable($scope.textFileContents[index].aTable);
      $scope.textFileContents[index].aTable = null;
    }

    var fc = function (str, i, min, max) {
      var acum = "";
      for (var f = min; f < max; f++) {
        acum += str.charAt(i + f);
      }
      return acum;
    }

    var fw = function (str, i, min, max) {
      var acum = "";
      for (var f = min; f < max; f++) {
        acum += str[i + f].toLowerCase() + " ";
      }
      acum = acum.substring(0, acum.length - 1);
      return acum;
    }

    function testText(testFC, f1, i) {
      var num1 = parseInt(f1[i].fTable[0][0].charAt(1));
      var num2 = parseInt(f1[i].fTable[0][0].charAt(2));
      if (f1[i].fTable[0][0].charAt(0) == 'C') {
        var f01 = function (str, i) { return fc(str, i, 0, num1) }; // old notation pre-ES6...
        var f02 = function (str, i) { return fc(str, i, num1, num1 + num2) };
        testFC.prob.push({
          "number": i,
          "name": f1[i].name,
          "prob": getProbC(testFC.textContent, f1[i].fTable, num1 + num2 - 1, f01, f02)
        });
      } else {
        var f01 = function (str, i) { return fw(str, i, 0, num1) };
        var f02 = function (str, i) { return fw(str, i, num1, num1 + num2) };
        testFC.prob.push({
          "number": i,
          "name": f1[i].name,
          "prob": getProbW(testFC.textContent, f1[i].fTable, num1 + num2 - 1, f01, f02)
        });
      }
    }

    $scope.identifyText = function (index) {
      $scope.testFileContents[index].prob = [];
      for (var i = 0; i < $scope.textFileContents.length; i++) {
        if ($scope.textFileContents[i].fTable) {
          testText($scope.testFileContents[index], $scope.textFileContents, i);
        } else {
          $scope.testFileContents[index].prob.push("??")
        }
      }
      for (var i = 0; i < $scope.fTableFileContents.length; i++) {
        testText($scope.testFileContents[index], $scope.fTableFileContents, i);
      }
    };

    $scope.generateText = function (fTable) {
      if (fTable[0][0] == "C11" || fTable[0][0] == "C12" || fTable[0][0] == "C13" || fTable[0][0] == "C14" || fTable[0][0] == "C15") {
        $scope.generatedText = createTextFromFrequencyGraph(fTable, 1, false);
      }
      if (fTable[0][0] == "C21" || fTable[0][0] == "C22" || fTable[0][0] == "C23" || fTable[0][0] == "C24" || fTable[0][0] == "C25") {
        $scope.generatedText = createTextFromFrequencyGraph(fTable, 2, false);
      }
      if (fTable[0][0] == "C31" || fTable[0][0] == "C32" || fTable[0][0] == "C33" || fTable[0][0] == "C34" || fTable[0][0] == "C35") {
        $scope.generatedText = createTextFromFrequencyGraph(fTable, 3, false);
      }
      if (fTable[0][0] == "C41" || fTable[0][0] == "C42" || fTable[0][0] == "C43" || fTable[0][0] == "C44" || fTable[0][0] == "C45") {
        $scope.generatedText = createTextFromFrequencyGraph(fTable, 4, false);
      }
      if (fTable[0][0] == "C51" || fTable[0][0] == "C52" || fTable[0][0] == "C53" || fTable[0][0] == "C54" || fTable[0][0] == "C55") {
        $scope.generatedText = createTextFromFrequencyGraph(fTable, 5, false);
      }
      if (fTable[0][0] == "W11" || fTable[0][0] == "W12" || fTable[0][0] == "W13" || fTable[0][0] == "W14" || fTable[0][0] == "W15") {
        $scope.generatedText = createTextFromFrequencyGraph(fTable, 1, true);
      }
      if (fTable[0][0] == "W21" || fTable[0][0] == "W22" || fTable[0][0] == "W23" || fTable[0][0] == "W24" || fTable[0][0] == "W25") {
        $scope.generatedText = createTextFromFrequencyGraph(fTable, 2, true);
      }
      if (fTable[0][0] == "W31" || fTable[0][0] == "W32" || fTable[0][0] == "W33" || fTable[0][0] == "W34" || fTable[0][0] == "W35") {
        $scope.generatedText = createTextFromFrequencyGraph(fTable, 3, true);
      }
      if (fTable[0][0] == "W41" || fTable[0][0] == "W42" || fTable[0][0] == "W43" || fTable[0][0] == "W44" || fTable[0][0] == "W45") {
        $scope.generatedText = createTextFromFrequencyGraph(fTable, 4, true);
      }
      if (fTable[0][0] == "W51" || fTable[0][0] == "W52" || fTable[0][0] == "W53" || fTable[0][0] == "W54" || fTable[0][0] == "W55") {
        $scope.generatedText = createTextFromFrequencyGraph(fTable, 5, true);
      }

    }

    function getProbC(str, fTable, order, fchar1, fchar2) {
      acum = 0;
      for (var i = 0; i < str.length; i++) {
        if (i < str.length - order) {
          var char1 = fchar1(str, i);
          var char2 = fchar2(str, i)
          var position1 = findV(fTable, char1);
          var position2 = findH(fTable, char2);
          if (position1 > 0 && position2 > 0 && fTable[position1][position2] > 0) {
            acum = acum + fTable[position1][position2];
          }
        }
      }
      return acum / str.length;
    }

    function getProbW(strIni, fTable, order, fword1, fword2) {
      str = strIni.match(/([A-Za-zäÄëËïÏöÖüÜáéíóúáéíóúÁÉÍÓÚÂÊÎÔÛâêîôûàèìòùÀÈÌÒÙçñÇÑ]+)/gim);
      acum = 0;
      for (var i = 0; i < str.length; i++) {
        if (i < str.length - order) {
          var word1 = fword1(str, i);
          var word2 = fword2(str, i);
          var position1 = findV(fTable, word1);
          var position2 = findH(fTable, word2);
          if (position1 > 0 && position2 > 0 && fTable[position1][position2] > 0) {
            acum = acum + fTable[position1][position2];
          }
        }
      }
      return acum / str.length;
    }

    exportToFile = function (filename, objectToExport) {
      var blob = new Blob([angular.toJson(objectToExport, true)], { type: 'text/text' });
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, filename);
      } else {
        var e = document.createEvent('MouseEvents'),
          a = document.createElement('a');
        a.download = filename;
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
        e.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);
      }
    };

    $scope.saveFGraph = function (index) {
      exportToFile($scope.textFileContents[index].fTable[0][0] + "." + $scope.textFileContents[index].name + ".json", $scope.textFileContents[index].fTable);
    }

    $scope.onTextFileChange = function () {
      var files = $scope.fileArray;
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var reader = new FileReader();
        reader.onload = (function (f) {
          return function (e) {
            $scope.$apply(function () {
              var textContent = e.target.result;
              $scope.textFileContents.push({ name: f.name, type: f.type, size: f.size, textContent: textContent });
            });
          };
        })(file);
        reader.readAsText(file);
        $scope.status = 'loaded';
      }
    };

    $scope.onTestFileChange = function () {
      var files = $scope.fileArray2;
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var reader = new FileReader();
        reader.onload = (function (f) {
          return function (e) {
            $scope.$apply(function () {
              var textContent = e.target.result;
              $scope.testFileContents.push({ name: f.name, type: f.type, size: f.size, textContent: textContent });
            });
          };
        })(file);
        reader.readAsText(file);
        $scope.status = 'loaded';
      }
    };


    $scope.onFTableFileChange = function () {
      var files = $scope.fileArray3;
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var reader = new FileReader();
        reader.onload = (function (f) {
          return function (e) {
            $scope.$apply(function () {
              var textContent = e.target.result;
              var fTable = JSON.parse(textContent);
              $scope.fTableFileContents.push({ name: f.name, type: 'fTable' + fTable[0][0], size: fTable.length + "x" + fTable[0].length, fTable: fTable });
            });
          };
        })(file);
        reader.readAsText(file);
        $scope.status = 'loaded';
      }
    };

    function findV(state, char2find) {
      for (var i = 1; i < state.length; i++) { //0,0 is empty
        if (state[i][0] == char2find) {
          return i;
        }
      }
      return 0;
    }
    function findH(state, char2find) {
      for (var i = 1; i < state[0].length; i++) { //0,0 is empty
        if (state[0][i] == char2find) {
          return i;
        }
      }
      return 0;
    }

    function createPositionH(state, c) {
      newArray = [c];
      for (var i = 1; i < state[0].length; i++) {
        newArray.push(0);
      }
      state.push(newArray);
      return state;
    }

    function createPositionV(state, c) {
      state[0].push(c);
      for (var i = 1; i < state.length; i++) {
        state[i].push(0);
      }
      return state;
    }

    function addTotals(state) {
      state[0].push('TOTAL');
      for (var i = 1; i < state.length; i++) {
        var sum = 0;
        for (var j = 1; j < state[i].length; j++) {
          sum += state[i][j];
        }
        state[i].push(sum);
      }
      return state;
    }

    function buildFrequencyTable(state) {
      statef = [];
      statef.push(state[0]);
      for (var i = 1; i < state.length; i++) {
        statef.push([]);
        statef[i].push(state[i][0]);
        for (var j = 1; j < state[i].length - 1; j++) {
          if (state[i][state[i].length - 1] > 0) {
            statef[i].push(state[i][j] / state[i][state[i].length - 1]);
          } else {
            statef[i].push(0);
          }
        }
      }
      return statef;
    }

    function createTextFromFrequencyGraph(statef, order, sp) {
      var a = statef[randomInt(1, statef.length - 1)];
      var text = a[0];
      if (sp) {
        text += " ";
      }
      for (var f = 0; f <= 5000; f++) {
        r = Math.random();
        var acum = 0;
        for (var j = 1; j < a.length; j++) {
          acum += a[j];
          if (r <= acum) {
            text += statef[0][j];
            if (sp) {
              var position = findV(statef, text.trim().split(" ").splice(-1 * order).join(" "));
              text += " ";
            } else {
              var position = findV(statef, text.slice(-1 * order));
            }
            if (position == 0) {
              position = randomInt(1, statef.length - 1)
            }
            a = statef[position];
            break;
          }
        }
      }
      return text;
    }

    function buildAsoluteGraphOrderC(str, state, order, fchar1, fchar2) {
      for (var i = 0; i < str.length; i++) {
        if (i < str.length - order) {
          var char1 = fchar1(str, i);
          var char2 = fchar2(str, i);
          var position1 = findV(state, char1);
          var position2 = findH(state, char2);
          if (position1 > 0 && position2 > 0) {
            state[position1][position2] += 1;
          } else {
            if (position1 > 0) {
              state = createPositionV(state, char2);
              state[position1][state[position1].length - 1]++;
            } else {
              if (position2 > 0) {
                state = createPositionH(state, char1);
                state[state.length - 1][position2]++;
              } else {
                state = createPositionH(state, char1);
                state = createPositionV(state, char2);
                state[state.length - 1][state[position1].length - 1]++;
              }
            }
          }
        }
      }
      state = addTotals(state);
      return state;
    }

    function buildAsoluteGraphOrderW(strIni, state, order, fword1, fword2) {
      str = strIni.match(/([A-Za-zäÄëËïÏöÖüÜáéíóúáéíóúÁÉÍÓÚÂÊÎÔÛâêîôûàèìòùÀÈÌÒÙçñÇÑ]+)/gim);
      for (var i = 0; i < str.length; i++) {
        if (i < str.length - order) {
          var word1 = fword1(str, i);
          var word2 = fword2(str, i);
          var position1 = findV(state, word1);
          var position2 = findH(state, word2);
          if (position1 > 0 && position2 > 0) {
            state[position1][position2] += 1;
          } else {
            if (position1 > 0) {
              state = createPositionV(state, word2);
              state[position1][state[position1].length - 1]++;
            } else {
              if (position2 > 0) {
                state = createPositionH(state, word1);
                state[state.length - 1][position2]++;
              } else {
                state = createPositionH(state, word1);
                state = createPositionV(state, word2);
                state[state.length - 1][state[position1].length - 1]++;
              }
            }
          }
        }
      }
      state = addTotals(state);
      return state;
    }

    function randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

  }
]);