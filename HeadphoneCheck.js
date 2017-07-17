(function(HeadphoneCheck, $, undefined) {

  /*** PUBLIC CONFIGURATION VARIABLES ***/
  HeadphoneCheck.totalExamples = 8;
  HeadphoneCheck.examplesPerPage = 2;
  HeadphoneCheck.doShuffleTrials = true;
  HeadphoneCheck.sampleWithReplacement = true;
  HeadphoneCheck.debug = true;
  HeadphoneCheck.calibration = true;

  /*** PRIVATE CONFIGURATION VARIABLES ***/
  var storageBackend;
  var storageKey = 'headphoneCheckCache';
  var validColor = "black";
  var warningColor = "red";
  var requirePlayback = false;
  var defaultAudioType = "audio/mpeg";

  var pageNum = 0;
  var totalCorrect = 0;
  var stimMap = [];
  var calibration = [];
  var jsonData;
  var lastPage;
  var st_isPlaying = false;

  //PRIVATE FUNCTIONS
  /**
   * Initialize the headphone check and setup the environment
   *
   * @return {undefined}
   */
  function setupHeadphoneCheck() {
    // set the storage backend
    storageBackend = isStorageAvailable() ? sessionStorage : undefined;
  }

  /**
   * Check if storage is available via localStorage and sessionStorage.
   * NOTE: this can misbehave if the storage is full.
   *
   * @return {Boolean} - Indicates if localStorage and sessionStorage are
   * available.
   */
  function isStorageAvailable(){
    var test = 'test';
    try {
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    }
    catch(e) {
      $(document).trigger('hcStorageUnavailable');
      return false;
    }
  }

  /**
   * Attempt to load the cached progress state from a JSON string in
   * local storage.
   *
   * @return {bool} - Indicates if restore was successful.
   */
  function restoreProgress() {
    var didRestore = false;
    if (storageBackend !== undefined && storageKey in storageBackend) {
      // Code for localStorage/sessionStorage
      var progressData = JSON.parse(storageBackend.getItem(storageKey));
      // progressData = {
      //   "HeadphoneCheck.totalExamples": HeadphoneCheck.totalExamples,
      //   "HeadphoneCheck.examplesPerPage": HeadphoneCheck.examplesPerPage,
      //   "HeadphoneCheck.doShuffleTrials": HeadphoneCheck.doShuffleTrials,
      //   "HeadphoneCheck.sampleWithReplacement": HeadphoneCheck.sampleWithReplacement,
      //   "HeadphoneCheck.debug": HeadphoneCheck.debug,
      //   "HeadphoneCheck.calibration": HeadphoneCheck.calibration,
      //   "validColor": validColor,
      //   "warningColor": warningColor,
      //   "requirePlayback": requirePlayback,
      //   "defaultAudioType": defaultAudioType,
      //   "totalCorrect": totalCorrect,
      //   "stimMap": stimMap,
      //   "calibration": calibration,
      //   "lastPage": lastPage,
      //   "st_isPlaying": st_isPlaying
      // };

      // $(document).trigger('headphoneRestoredProgress');
      $(document).trigger('hcRestoreProgressSuccess');
      didRestore = true;
    }
    else {
      // No Web Storage support..
      $(document).trigger('hcRestoreProgressFail');
    }
    return didRestore;
  }

  function storeProgress() {
    if (storageBackend !== undefined) {
      // Code for localStorage/sessionStorage.
      progressData = {
        "HeadphoneCheck.totalExamples": HeadphoneCheck.totalExamples,
        "HeadphoneCheck.examplesPerPage": HeadphoneCheck.examplesPerPage,
        "HeadphoneCheck.doShuffleTrials": HeadphoneCheck.doShuffleTrials,
        "HeadphoneCheck.sampleWithReplacement": HeadphoneCheck.sampleWithReplacement,
        "HeadphoneCheck.debug": HeadphoneCheck.debug,
        "HeadphoneCheck.calibration": HeadphoneCheck.calibration,
        "validColor": validColor,
        "warningColor": warningColor,
        "requirePlayback": requirePlayback,
        "defaultAudioType": defaultAudioType,
        "totalCorrect": totalCorrect,
        "stimMap": stimMap,
        "calibration": calibration,
        "lastPage": lastPage,
        "st_isPlaying": st_isPlaying
      };
      storageBackend.setItem(storageKey, JSON.stringify(progressData));
      $(document).trigger('hcStoreProgressSuccess');
    }
    else {
      // No Web Storage support..
      $(document).trigger('hcStoreProgressFail');
    }
  }

  function updateCorrect(stim, response) {
    if (stim.correct == response) {
      totalCorrect++;
    }
  }

  //FUNCTIONS FOR INITIALIZING THE STIMULI AND SHUFFLING THE JSON FILE
  // function randomInt(a, b, n) {
  //   // generate n random integers between [a, b]
  //   var randIntList = [];
  //   var minVal = Math.min(a, b);
  //   var maxVal = Math.max(a, b);
  //   // var rand = minVal + (maxVal - minVal) * Math.random();
  //   for (var i = 0; i < n; i++) {
  //     randIntList.push(Math.floor(minVal + (maxVal - minVal + 1) * Math.random())); // +1 to include right endpoint
  //   }
  //   outVal = n == 1 ? randIntList[0] : randIntList;
  //   return outVal;
  // }

  // function shuffleTrials(data) {
  //   stimMap = shuffle(data.stim); //shuffles the array
  // }

  function shuffleTrials(trialArray, n, withReplacement) {
    // stimMap = shuffle(trialArray); //shuffles the array
    console.log('n: ' + n +' w/R: ' + withReplacement)
    var shuffledTrials = withReplacement ? sampleWithReplacement(trialArray, n) : shuffle(trialArray, n);
    stimMap = shuffledTrials;
    // return shuffledTrials;
  }

  // TODO: fix this, this doesn"t work
  function parseAudioType(stimID) {
    console.log("TYPE: " +stimID);
    console.log(stimMap);
    var typeStr = stimMap[stimID];
    console.log("TYPE: "+typeStr);
    if (typeStr === undefined) {
      typeStr = defaultAudioType;
    }
    console.log("TYPE: "+typeStr);
    return typeStr;
  }

  function checkPassFail(correctThreshold) {
    if (totalCorrect >= correctThreshold) {
      return true;
    }
    else { return false; }
  }

  function playStim(stimID) {
    var stimFile = "audio" + stimID;
    // set onended callback
    $("#" + stimFile).on("ended", function() {
      // reset playback state
      st_isPlaying = false;
      // activate responses
      if (requirePlayback) {
        $("#radioButtons" + stimID).css("pointer-events", "auto");
      }
    });

    $('#b' + stimID).css('border', 'none');
    $("#" + stimFile).get(0).play();
    st_isPlaying = true;
    // hack to disable responding during playback
    $("#radioButtons" + stimID).css("pointer-events", "none");
  }

  function playCalibration(calibrationFile) {
    $("#" + calibrationFile).on("ended", function() {
      // reset playback state
      st_isPlaying = false;
    });
    $("#" + calibrationFile).get(0).play();
    st_isPlaying = true;
  }

  function disableClick(buttonID) {
    $("#" + buttonID).prop("disabled", true);
  }

  function checkCanContinue() {
    // Check that each question has a response, if not, highlight what is needed
    // TODO: This is HACKY and probably isn"t the best idea
    numResponses = $(".ui-buttonset-vertical>label>input[type=radio]:checked").length;
    return numResponses >= HeadphoneCheck.examplesPerPage; // easy for user to circumvent check
  }

  function renderResponseWarnings() {
    // toggle the response warnings

    // get parent div of anything checked, should only be 1 radio button per div
    var checked = $(".ui-buttonset-vertical>label>input[type=radio]:checked").parent().parent();

    // get parent divs of anything unchecked, can be as many as # of responses
    var unchecked = $(".ui-buttonset-vertical>label>input[type=radio]").not(":checked").parent().parent();

    // get all top level divs (i.e., trial containers) without any responses
    var uncheckedTrials = $(unchecked).not(checked).parent();

    // hide warning on completed trials
    $(checked).parent().css("border", "5px solid " + validColor);

    // show warning on empty trials
    $(uncheckedTrials).css("border", "5px solid " + warningColor);
  }

  // function shuffle(array) {
  //   var currentIndex = array.length, temporaryValue, randomIndex;

  //   // While there remain elements to shuffle...
  //   while (0 !== currentIndex) {
  //     // Pick a remaining element...
  //     randomIndex = Math.floor(Math.random() * currentIndex);
  //     currentIndex -= 1;

  //     // And swap it with the current element.
  //     temporaryValue = array[currentIndex];
  //     array[currentIndex] = array[randomIndex];
  //     array[randomIndex] = temporaryValue;
  //   }
  //   return array;
  // }

  // renderHTML takes in the stimulus ID and the stimulus file and creates a div
  // element with everything needed to play and respond to this sound
  function renderOneTrialHTML(stimDiv, stimID, stimFile) {
    console.log('--->' +' '+ stimDiv + stimID + ', ' + stimFile)
    if (stimFile === undefined) return;
    var divID = "stim" + stimID;
    // console.log(divID);
    $("<div/>", {id: divID, class: "trialDiv"}).appendTo(("#" + stimDiv));

    //add in the audio source
    $("<audio/>", {
        id: "audio" + stimID,
        // type: "audio/mpeg", // TODO: Factor this out, should be user defined
        // type: parseAudioType(stimID),
        src: stimFile
      }).appendTo($("#" + divID));

    if (HeadphoneCheck.debug) {
      $("<div/>", {
          text: "Trial ID: " + stimID
      }).appendTo($("#" + divID));
    }

    //add in the button for playing the sound
    $("<button/>", {
      id: "b" + stimID,
      disabled: false,
      click: function () {
        if (!st_isPlaying){
          playStim(stimID);
          disableClick(this.id);
        }
        else {}
      },
      text: "Play"
    }).appendTo($("#" + divID));

    //add in the radio buttons for selecting which sound was softest
    $("<div/>", {
      id: "radioButtons"+stimID,
      class: "ui-buttonset-vertical",
      // width: "30%"
    }).appendTo($("#" + divID));

    //give the label info for the buttons
    var radioButtonInfo = [
                            {"id": "1", "name": "FIRST sound was SOFTEST" },
                            {"id": "2", "name": "SECOND sound was SOFTEST" },
                            {"id": "3", "name": "THIRD sound was SOFTEST"}
                          ];

    $.each(radioButtonInfo, function() {
      $("#radioButtons" + stimID).append(
        $("<label/>", {
          for: "radio" + this.id + '-stim' + stimID,
          class: "radio-label",
          text: this.name
        }).prepend(
            $("<input/>", {
                type: "radio",
                id: "radio" + this.id + '-stim' + stimID,
                name: "radio-resp" + stimID,
                class: "radio-responses",
                value: this.id
            })
          )
        );
    });
  }

  function teardownHTMLPage() {
    $("#container-exp").empty();
  }

  //PUBLIC FUNCTIONS
  HeadphoneCheck.this = this;

  /**
   * Load the experiment configuration, either by restoring cached values
   * from localStorage or by AJAX fetching from a URL.
   * @param {jsonPath} title - URL to experiment configuration.
   * @param {useCache} title - If truthy, will attempt to load cached
   * values from localStorage. If this succeeds, data from the URL will
   * not be fetched. If this fails or is falsy, the data will be loaded
   * from the URL.
   */
  HeadphoneCheck.loadStimuli = function (jsonPath, useCache) {
    setupHeadphoneCheck();
    // attempt to load from cache
    console.log('Storage Backend: '+storageBackend);
    var didLoadCache = false;
    if (useCache) didLoadCache = restoreProgress();

    // if didn't load from cache, fetch the json file via ajax
    if (!didLoadCache) {
      $.ajax({
          dataType: "json",
          url: jsonPath,
          async: false,
          success: function (data) {
            $(document).trigger('hcLoadStimuliSuccess', {'data': data});
            jsonData = data;
            if (HeadphoneCheck.doShuffleTrials) {
              shuffleTrials(data.stim, HeadphoneCheck.totalExamples, HeadphoneCheck.sampleWithReplacement);
              // shuffleTrials(data, HeadphoneCheck.totalExamples, HeadphoneCheck.sampleWithReplacement);
              console.log(stimMap);
            }
            if (HeadphoneCheck.calibration) {
              calibration = data.calibration;
              console.log(calibration);
            }
            console.log(stimMap.length)
            lastPage = Math.ceil(stimMap.length / HeadphoneCheck.examplesPerPage); //get last page
            if (useCache) storeProgress();
          },
          error: function (data) {
            $(document).trigger('hcLoadStimuliFail', {'data': data});
          },
          complete: function (data) {
            $(document).trigger('hcLoadStimuliDone', {'data': data});
          }
      });
    }
  };

  HeadphoneCheck.renderHTMLPage = function(c) {
    //get the stimuli to display on this page
    var currentStimuli = [];
    for (i = 0; i < HeadphoneCheck.examplesPerPage; i++) {
      var trialInd = pageNum * HeadphoneCheck.examplesPerPage + i;
      if (trialInd < HeadphoneCheck.totalExamples) {
        currentStimuli.push(stimMap[trialInd]);
      }
    }
    console.log('curStim')
    console.log(currentStimuli)

    $("<div/>", {
      id: "instruct",
      class: "warning",
      html: "When you hit <b>Play</b>, you will hear three sounds separated by silences."
    }).appendTo($("#container-exp"));

    $("<div/>", {
      class: "warning",
      text: "Simply judge WHICH SOUND WAS SOFTEST(quietest)-- 1, 2, or 3?"
    }).appendTo($("#container-exp"));

    $("<div/>", {
      class: "warning",
      text: "Test sounds can only be played once!"
    }).appendTo($("#container-exp"));

    // add in a group for each item in stimulus
    $.each(currentStimuli, function (ind, val) {
      // prefix the stim id with the temporary (page) trial index, allows for duplicate trials
      renderOneTrialHTML("container-exp", ind+'-src'+val.id, val.stimFile);
    });

    if (requirePlayback) {
      // no response until the sound is played
      $(".ui-buttonset-vertical").click(function(event) {
        console.log(event.target);
        var parentPlayButton = $(event.target).parents().filter('.trialDiv').find('button');
        console.log($(parentPlayButton).prop('disabled'))
        // if the play button isn't disabled, it hasn't been played, so show a warning
        if (!$(parentPlayButton).prop('disabled')) {
          $(parentPlayButton).css('border', '3px solid red');
          event.preventDefault();
        }
      });
    }

    // Add button to continue
    $("<button/>", {
      class: "warning",
      // type: "button",
      text: "Continue",
      click: function () {
        var canContinue = checkCanContinue();
        for (stimID = 0; stimID < HeadphoneCheck.examplesPerPage; stimID++) {
          updateCorrect(currentStimuli[stimID], $("input[name=radio-resp" + stimID + "]:checked").val());
        }
        if (pageNum == lastPage - 1) { // TODO: -1 for indexing; make indexing consistent
          teardownHTMLPage();
          checkPassFail();
          alert("done with headphone check");
        }
        else if (canContinue) { // Advance the page
          teardownHTMLPage();
          pageNum++;
          HeadphoneCheck.renderHTMLPage(pageNum);
        }
        else { // need responses, don"t advance page, show warnings
          renderResponseWarnings();
        }
      }
    }).appendTo($("#container-exp"));
  };

  HeadphoneCheck.renderCalibration = function() {
    $("<div/>", {
      id: "instruct",
      class: "warning",
      text: "You must be wearing headphones to do this HIT!"
    }).appendTo($("#container-exp"));

    $("<div/>", {
      class: "warning",
      text: "First, set your computer volume to about 25% of maximum."
    }).appendTo($("#container-exp"));

    $("<div/>", {
      class: "warning",
      text: "Level Calibration"
    }).appendTo($("#container-exp"));

    $("<div/>", {
      class: "warning",
      text: "Press the button, then turn up the volume on your computer until the calibration noise is at a loud but comfortable level."
    }).appendTo($("#container-exp"));

    $("<div/>", {
      id: "calibration",
      class: "calibrationDiv",
      text: "Play the calibration sound as many times as you like."
    }).appendTo($("#container-exp"));

    //add in the audio source
    $("<audio/>", {
        id: "audioCalibration",
        type: "audio/mpeg", // TODO: Factor this out, should be user defined
        // type: parseAudioType(stimID),
        src: calibration.stimFile
      }).appendTo($("#calibration"));

    //add in the button for playing the sound
    $("<button/>", {
      id: "bCalibration" ,
      disabled: false,
      click: function () {
        if (!st_isPlaying){
          playCalibration("audioCalibration");
        }
        $("#continueCalibration").prop('disabled',false);
      },
      text: "Play"
    }).appendTo($("#calibration"));

    $("<div/>", {
      class: "warning",
      html: "Press <b>Continue</b> when level calibration is complete."
    }).appendTo($("#container-exp"));

    // Add button to continue
    $("<button/>", {
      id: "continueCalibration",
      class: "warning",
      disabled: true,
      // type: "button",
      text: "Continue",
      click: function () {
        teardownHTMLPage();
        HeadphoneCheck.renderHTMLPage(0);
      }
    }).appendTo($("#container-exp"));
};


}( window.HeadphoneCheck = window.HeadphoneCheck || {}, jQuery));

$(document).ready(function() {
  $(document).on("hcStorageUnavailable", function( event, param1) {
    alert( event.type );
  });
  $(document).on("hcRestoreProgressSuccess", function( event, param1) {
    alert( event.type );
  });
  $(document).on("hcRestoreProgressFail", function( event, param1) {
    alert( event.type );
  });

  var useCache = false;
  var jsonPath = "headphone_check_stim.json";
  HeadphoneCheck.loadStimuli(jsonPath, useCache);
  // var continueVal = HeadphoneCheck.renderCalibration();
  var continueVal = HeadphoneCheck.renderHTMLPage();
  if (continueVal) {
    alert("continuing on!");
  }
});

