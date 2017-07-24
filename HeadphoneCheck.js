(function(HeadphoneCheck, $, undefined) {

  /*** PUBLIC CONFIGURATION VARIABLES ***/
  // NOTE: DON'T CHANGE VALUES HERE. Use a similar config object to
  // override any default values you wish to change.
  var headphoneCheckDefaultConfig = {
                                     jsonPath: 'http://mcdermottlab.mit.edu/publicHeadphoneCheck/headphoneCheckDefaultStimuli.json',
                                     totalTrials: 6,
                                     trialsPerPage: 3,
                                     correctThreshold: 4,
                                     useSequential: true,
                                     doShuffleTrials: true,
                                     sampleWithReplacement: false,
                                     doCalibration: true,
                                     useCache: false,
                                     debug: false,
                                    };

  /*** PRIVATE CONFIGURATION VARIABLES ***/
  var storageBackend;
  var storageKey = 'headphoneCheckCache';
  var validColor = 'black';
  var warningColor = 'red';
  var requirePlayback = true;
  var defaultAudioType = 'audio/mpeg';

  var headphoneCheckData = {pageNum: 0,
                            stimIDList: [],
                            stimDataList: [],
                            trialScoreList: [],
                            responseList: [],
                            calibration: [],
                            jsonData: undefined,
                            lastPage: undefined,
                           };
  var st_isPlaying = false;

  /*** PUBLIC FUNCTIONS ***/
  /**
   * @param  {String} -  URL to json file containing the stimulus data.
   * @param  {Object} - Object containing headphone check configuration
   * parameters that will override the defaults defined in headphoneCheckDefaultConfig.
   * @return {undefined}
   */
  HeadphoneCheck.runHeadphoneCheck = function(configData) {
    parseHeadphoneCheckConfig(configData);
    setupHeadphoneCheck();

    $(document).on('hcCalibrationStart', function(event, data) {
      console.log('calib start event')
      HeadphoneCheck.renderHeadphoneCheckCalibration();
    });
    $(document).on('hcCalibrationEnd', function(event, data) {
      console.log('calib end event')
      $(document).trigger('hcHeadphoneCheckStart');
    });

    $(document).on('hcHeadphoneCheckStart', function(event, data) {
      console.log('HC start event')
      HeadphoneCheck.renderHeadphoneCheckPage();
    });
    $(document).on('hcHeadphoneCheckEnd', function(event, data) {
      console.log('HC end event')
      var results = data.data;
      var didPass = data.didPass;

      if (didPass) {
        $('<div/>', {
          html: 'Screening task passed.<br/>totalCorrect: ' + getTotalCorrect(results.trialScoreList)
        }).appendTo($('body'));
      }
      else {
        $('<div/>', {
          html: 'Screening task failed.<br/>totalCorrect: ' + getTotalCorrect(results.trialScoreList)
        }).appendTo($('body'));
      }

    });

    HeadphoneCheck.loadStimuli(HeadphoneCheck.jsonPath);
  };

  /**
   * Load the experiment configuration, either by restoring cached values
   * from localStorage or by AJAX fetching from a URL.
   *
   * @param {String} jsonPath - URL to experiment configuration.
   * values from localStorage. If this succeeds, data from the URL will
   * not be fetched. If this fails or is falsy, the data will be loaded
   * from the URL.
   */
  HeadphoneCheck.loadStimuli = function (jsonPath) {
    // attempt to load from cache
    console.log('Storage Backend: '+storageBackend);
    var didLoadCache = false;
    if (HeadphoneCheck.useCache) didLoadCache = restoreProgress();

    // if didn't load from cache, fetch the json file via ajax
    if (!didLoadCache) {
      $.ajax({
          dataType: 'json',
          url: jsonPath,
          async: true,
          crossDomain: true,
          success: function (data) {
            $(document).trigger('hcLoadStimuliSuccess', {'data': data});
            headphoneCheckData.jsonData = data;
            if (HeadphoneCheck.doShuffleTrials) {
              shuffleTrials(data.stimuli, HeadphoneCheck.totalTrials, HeadphoneCheck.sampleWithReplacement);
            }
            if (HeadphoneCheck.doCalibration) {
              headphoneCheckData.calibration = data.calibration;
            }
            headphoneCheckData.lastPage = Math.ceil(headphoneCheckData.stimDataList.length / HeadphoneCheck.trialsPerPage);
            if (HeadphoneCheck.useCache) storeProgress();

            if (HeadphoneCheck.doCalibration) {
              $(document).trigger('hcCalibrationStart');
            }
            else {
              $(document).trigger('hcHeadphoneCheckStart');
            }
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

  /**
   * Append the elements required for a page (collection) of headphone
   * check trials to the DOM and bind associated event listeners.
   *
   * @return {undefined}
   */
  HeadphoneCheck.renderHeadphoneCheckPage = function() {
    // render boilerplate instruction text
    $('<div/>', {
      class: 'hc-instruction',
      html: 'When you hit <b>Play</b>, you will hear three sounds separated by silences.'
    }).appendTo($('#hc-container'));
    $('<div/>', {
      class: 'hc-instruction',
      text: 'Simply judge WHICH SOUND WAS SOFTEST (quietest) -- 1, 2, or 3?'
    }).appendTo($('#hc-container'));
    $('<div/>', {
      class: 'hc-instruction',
      text: 'Test sounds can only be played once!'
    }).appendTo($('#hc-container'));

    //get the stimuli to display on this page
    console.log(headphoneCheckData)
    for (i = 0; i < HeadphoneCheck.trialsPerPage; i++) {
      var trialInd = headphoneCheckData.pageNum * HeadphoneCheck.trialsPerPage + i;
      if (trialInd < HeadphoneCheck.totalTrials) {
        // prefix the stim id with the temporary (page) trial index, allows for duplicate trials
        var stimData = headphoneCheckData.stimDataList[trialInd];
        var stimID = headphoneCheckData.stimIDList[trialInd];
        // add in a group for each item in stimulus
        renderHeadphoneCheckTrial('hc-container', stimID , stimData.src);
      }
    }

    if (requirePlayback) {
      // no response until the sound is played
      $('.hc-buttonset-vertical').click(function(event) {
        var parentPlayButton = $(event.target).parents().filter('.hc-trial-div').find('button');

        // if the play button isn't disabled, it hasn't been played, so show a warning
        if (!$(parentPlayButton).prop('disabled')) {
          $(parentPlayButton).parent().css('border', '3px solid ' + warningColor);
          event.preventDefault();
        }

        var prefixStr = 'hc-radio-buttonset-';
        var stimID = this.id.slice(this.id.indexOf(prefixStr) + prefixStr.length);
        var response = getResponseFromRadioButtonGroup(stimID);
        if (response !== undefined) {
          parentPlayButton.parent().parent().css('border-color', validColor);
        }
      });
    }

    // Add button to continue
    $('<button/>', {
      text: 'Continue',
      click: function () {
        var canContinue = checkCanContinue();
        for (stimID = 0; stimID < HeadphoneCheck.trialsPerPage; stimID++) {
          var trialInd = headphoneCheckData.pageNum * HeadphoneCheck.trialsPerPage + stimID;
          var response = getResponseFromRadioButtonGroup(headphoneCheckData.stimIDList[trialInd]);
          scoreTrial(trialInd, headphoneCheckData.stimDataList[trialInd], response);
        }
        if (headphoneCheckData.pageNum == headphoneCheckData.lastPage - 1) { // TODO: -1 for indexing; make indexing consistent
          // handle edge case
          if (HeadphoneCheck.totalTrials == 1 && headphoneCheckData.trialScoreList[0] === undefined) {
            renderResponseWarnings();
            return;
          }
          teardownHTMLPage();
          var didPass = checkPassFail(HeadphoneCheck.correctThreshold);
          // console.log(headphoneCheckData)
          $(document).trigger('hcHeadphoneCheckEnd', {'didPass': didPass, 'data': headphoneCheckData});
        }
        else if (canContinue) { // Advance the page
          teardownHTMLPage();
          headphoneCheckData.pageNum++;
          HeadphoneCheck.renderHeadphoneCheckPage();
        }
        else { // need responses, don't advance page, show warnings
          renderResponseWarnings();
        }
      }
    }).appendTo($('#hc-container'));
  };

  /**
   * Append the elements required for the headphone check calibration
   * to the DOM and bind associated event listeners.
   *
   * @return {undefined}
   */
  HeadphoneCheck.renderHeadphoneCheckCalibration = function() {
    // render boilerplate instruction text
    $('<div/>', {
      class: 'hc-calibration-instruction',
      text: 'You must be wearing headphones to do this HIT!'
    }).appendTo($('#hc-container'));
    $('<div/>', {
      class: 'hc-calibration-instruction',
      text: 'Level Calibration'
    }).appendTo($('#hc-container'));
    $('<div/>', {
      class: 'hc-calibration-instruction',
      text: 'First, set your computer volume to about 25% of maximum.'
    }).appendTo($('#hc-container'));
    $('<div/>', {
      class: 'hc-calibration-instruction',
      text: 'Press the button, then turn up the volume on your computer until the ' +
            'calibration noise is at a loud but comfortable level.'
    }).appendTo($('#hc-container'));
    $('<div/>', {
      id: 'hc-calibration-div',
      text: 'Play the calibration sound as many times as you like.'
    }).appendTo($('#hc-container'));

    //add in the audio source
    $('<audio/>', {
        id: 'hc-calibration-audio',
        // type: 'audio/mpeg', // TODO: Factor this out, should be user defined
        // type: parseAudioType(stimID),
        src: headphoneCheckData.calibration.src
      }).appendTo($('#hc-calibration-div'));

    //add in the button for playing the sound
    $('<button/>', {
      id: 'hc-calibration-play-button' ,
      disabled: false,
      click: function () {
        if (!st_isPlaying){
          playCalibration('hc-calibration-audio');
        }
      },
      text: 'Play',
    }).css('display', 'block').appendTo($('#hc-calibration-div'));

    $('<div/>', {
      class: 'hc-calibration-instruction',
      html: 'Press <b>Continue</b> when level calibration is complete.',
    }).appendTo($('#hc-container'));

    // Add button to continue
    $('<button/>', {
      id: 'hc-calibration-continue-button',
      class: 'hc-calibration-instruction',
      disabled: true,
      text: 'Continue',
      click: function () {
        teardownHTMLPage();
        $(document).trigger('hcCalibrationEnd');
      }
    }).appendTo($('#hc-container'));
  };

  /*** PRIVATE FUNCTIONS ***/
  /**
   *  Create a div element with everything needed to play and respond to the
   *  stimulus associated with the provided arguments.
   *
   * @param  {String} - ID of the element (div) serving as the headphone check
   * container
   * @param  {String} - ID of the stimulus to be used for this trail
   * @param  {String} - URL of the sound source associated with this trial.
   * @return {undefined}
   */
  function renderHeadphoneCheckTrial(stimDiv, stimID, stimFile) {
    console.log('--->' +' '+ stimDiv + ' ' + stimID + ', ' + stimFile)
    if (stimFile === undefined) return;
    var divID = 'hc-stim-' + stimID;
    $('<div/>', {id: divID, class: 'hc-trial-div'}).appendTo(('#' + stimDiv));

    //add in the audio source
    $('<audio/>', {
        id: 'hc-audio-' + stimID,
        // type: 'audio/mpeg', // TODO: Factor this out, should be user defined
        // type: parseAudioType(stimID),
        src: stimFile
      }).appendTo($('#' + divID));

    if (HeadphoneCheck.debug) {
      $('<div/>', {
          text: 'Trial ID: ' + stimID
      }).appendTo($('#' + divID));
    }

    var trialBackgroundColor = $('#'+divID).css('background-color');
    $('<div/>', {id: 'hc-play-button-border-' + stimID,})
    .css({'border': '3px solid ' + trialBackgroundColor, 'display': 'inline-block'})
    .append(
      $('<button/>', {
        id: 'hc-play-button-' + stimID,
        text: 'Play',
        disabled: false,
        click: function () {
          if (!st_isPlaying) playStim(stimID);
        },
      }))
    .appendTo($('#' + divID));

    //add in the radio buttons for selecting which sound was softest
    $('<div/>', {
      id: 'hc-radio-buttonset-' + stimID,
      class: 'hc-buttonset-vertical',
    }).appendTo($('#' + divID));

    //give the label info for the buttons
    var radioButtonInfo = [
                            {'id': '1', 'name': 'FIRST sound was SOFTEST'},
                            {'id': '2', 'name': 'SECOND sound was SOFTEST'},
                            {'id': '3', 'name': 'THIRD sound was SOFTEST'},
                          ];

    $.each(radioButtonInfo, function() {
      $('#hc-radio-buttonset-' + stimID)
      .append($('<label/>', {
          for: 'hc-radio' + this.id + '-stim-' + stimID,
          class: 'hc-radio-label',
          text: this.name,
        })
      .prepend($('<input/>', {
                type: 'radio',
                id: 'hc-radio' + this.id + '-stim-' + stimID,
                name: 'hc-radio-response-' + stimID,
                class: 'hc-radio-response',
                value: this.id,
              })
      ));
    });
  }

  /**
   * Do everything required to clean up a headphone check page after it
   * is no longer needed.
   *
   * @return {undefined}
   */
  function teardownHTMLPage() {
    $('#hc-container').empty();
  }

  function parseHeadphoneCheckConfig(configData) {
    // Use configData fields to override defaults
    $.each(headphoneCheckDefaultConfig, function(index, defaultVal) {
      console.log(index)
      HeadphoneCheck[index] = index in configData ? configData[index] : defaultVal;
    });
  }

  /**
   * Initialize the headphone check and setup the environment.
   *
   * @return {undefined}
   */
  function setupHeadphoneCheck() {
    // set the storage backend
    storageBackend = isStorageAvailable() ? sessionStorage : undefined;

    // pedantic sanity checking HeadphoneCheck.totalTrials
    if (HeadphoneCheck.totalTrials <= 0) throw new Error('HeadphoneCheck.totalTrials must be positive.');
    if (HeadphoneCheck.trialsPerPage <= 0) throw new Error('HeadphoneCheck.trialsPerPage must be positive.');
    if (HeadphoneCheck.totalTrials < HeadphoneCheck.trialsPerPage) throw new Error('HeadphoneCheck.totalTrials cannot be less than HeadphoneCheck.trialsPerPage.');
    if (HeadphoneCheck.correctThreshold > HeadphoneCheck.totalTrials) throw new Error('HeadphoneCheck.correctThreshold cannot be greater than HeadphoneCheck.totalTrials.');

    $(document).trigger('hcInitialized');
  }

  /**
   * Setup and execute the logic required for headphone check stimulus
   * playback.
   *
   * @param  {String} - ID of the stimulus element to play
   * @return {undefined}
   */
  function playStim(stimID) {
    var trialID = stimID.slice(0, stimID.indexOf('-'));
    var previousTrialID = trialID - 1;
    if (HeadphoneCheck.useSequential && previousTrialID >= 0) {
      var response = getResponseFromRadioButtonGroup(headphoneCheckData.stimIDList[previousTrialID]);
      if (response === undefined && headphoneCheckData.trialScoreList[previousTrialID] === undefined) {
        $('#hc-stim-' + headphoneCheckData.stimIDList[previousTrialID]).css('border-color', warningColor);
        return;
      }
    }

    // playback will occur
    disableClick('hc-play-button-' + stimID);
    var stimFile = 'hc-audio-' + stimID;
    // set onended callback
    $('#' + stimFile).on('ended', function() {
      // reset playback state
      st_isPlaying = false;
      // activate responses
      if (requirePlayback) $('#hc-radio-buttonset-' + stimID).css('pointer-events', 'auto');
    });

    // clear warnings
    var trialBackgroundColor = $('#hc-play-button-border-' + stimID).parent().css('background-color');
    $('#hc-play-button-border-' + stimID).css('border-color', trialBackgroundColor);

    // play and set state
    $('#' + stimFile).get(0).play();
    st_isPlaying = true;
    // hack to disable responding during playback
    $('#hc-radio-buttonset-' + stimID).css('pointer-events', 'none');
  }

  /**
   * Disable the provided playback button.
   *
   * @param  {String} - ID of the button element to disable
   * @return {undefined}
   */
  function disableClick(buttonID) {
    $('#' + buttonID).prop('disabled', true);
  }

  /**
   * Setup and execute the logic required for headphone check calibration
   * sound playback.
   *
   * @param  {String} - ID of the calibration element to play
   * @return {undefined}
   */
  function playCalibration(calibrationID) {
    $('#' + calibrationID).on('ended', function() {
      // reset playback state
      st_isPlaying = false;
      $('#hc-calibration-continue-button').prop('disabled', false);
    });
    $('#' + calibrationID).get(0).play();
    st_isPlaying = true;
  }

  /**
   * Check that each question has a response, if not, highlight what is needed.
   *
   * @return {undefined}
   */
  function checkCanContinue() {
    // TODO: This is HACKY and probably isn't the best idea
    numResponses = $('.hc-buttonset-vertical>label>input[type=radio]:checked').length;
    return numResponses >= HeadphoneCheck.trialsPerPage;
  }

  /**
   * Display the required the response warnings for a headphone check trial.
   *
   * @return {undefined}
   */
  function renderResponseWarnings() {
    // get parent div of anything checked, should only be 1 radio button per div
    var checked = $('.hc-buttonset-vertical>label>input[type=radio]:checked').parent().parent();

    // get parent divs of anything unchecked, can be as many as # of responses
    var unchecked = $('.hc-buttonset-vertical>label>input[type=radio]').not(':checked').parent().parent();

    // get all top level divs (i.e., trial containers) without any responses
    var uncheckedTrials = $(unchecked).not(checked).parent();

    // hide warning on completed trials
    $(checked).parent().css('border', '5px solid ' + validColor);

    // show warning on empty trials
    $(uncheckedTrials).css('border', '5px solid ' + warningColor);
  }

  /**
   * Determine if there were sufficient correct responses to pass the
   * headphone check.
   *
   * @param  {Number} - Number of correct trials (score) required to
   * pass the headphone check
   * @return {Boolean} - Indicates if the headphone check was passed or
   * failed.
   */
  function checkPassFail(correctThreshold) {
    var totalCorrect = getTotalCorrect(headphoneCheckData.trialScoreList);
    return totalCorrect >= correctThreshold;
  }

  /**
   * Count the total number of correct responses by summing the values
   * in the input array.
   *
   * @param  {Array[Number]} - Array of scores to sum
   * @return {Number} - Sum of scores in the input array, counting
   * undefined values as 0
   */
  function getTotalCorrect(array) {
    return array.reduce(function getSum(total, val) {
      var num = val === undefined ? 0 : val;
      return total + num;
    }, 0);
  }


  function scoreTrial(trialInd, stimData, response) {
    if (response !== undefined) {
      var score = stimData.correct == response ? 1 : 0;
      headphoneCheckData.trialScoreList[trialInd] = score;
      headphoneCheckData.responseList[trialInd] = response;
      return score;
    }
  }

  /**
   * Get the response from a set of radio buttons.
   *
   * @param  {String} - ID of the radio buttonset element to collect a response
   * from
   *
   * @return {Undefined, String, Value} - Value of the selected radio button
   * in the buttonset, likely a String. If no button is selected, undefined
   * is returned.
   */
  function getResponseFromRadioButtonGroup(elemID) {
    console.log('####################### '+ elemID)
    return $('#hc-radio-buttonset-'+elemID+'>label>input:checked').val();
  }

  function shuffleTrials(trialArray, n, withReplacement) {
    console.log('n: ' + n +' w/R: ' + withReplacement)
    var shuffledTrials = withReplacement ? sampleWithReplacement(trialArray, n) : shuffle(trialArray, n);
    headphoneCheckData.stimDataList = shuffledTrials;
    headphoneCheckData.stimIDList = headphoneCheckData.stimDataList.map(function (val, ind) {
      // prefix the stim id with the temporary (page) trial index, allows for duplicate trials
       return 'trial' + ind + '-src' + val.id;
    });
    headphoneCheckData.trialScoreList = Array(headphoneCheckData.stimDataList.length); // TODO: is there a better place for this?
  }

  /**
   * Generate n random samples drawn uniformly with replacement from array.
   *
   * @param  {Array} - Array to sample from
   * @param  {Number} - Number of samples to generate
   * @return {Array[Number]} - List of samples
   */
  function sampleWithReplacement(array, n) {
    samples = [];
    for(var i = 0; i < n; i++) {
      ind = randomInt(0, array.length, 1);
      samples.push(array[ind]);
    }
    return samples;
  }

  /**
   * Shuffle the array and return the first n values. This is intended
   * to be used to sample without replacement but contains vestigial
   * remnants of Knuth shuffle.
   *
   * @param  {Array} - Array to shuffle
   * @param  {Number} - Number of samples to include in the output list;
   * if n is undefined, not positive, or larger than the input array,
   * the full shuffled list will be returned.
   * @return {Array[Number]} - List of samples from the shuffled list
   */
  function shuffle(array, n) {
    if (n === undefined) {
      n = array.length;
    }
    else if (n <= 0) {
      n = array.length;
      console.warn('Requested samples is not greater than 0. Using full array.');
    }
    else if (n > array.length) {
      n = array.length;
      console.warn('Requested more samples than there are available; use sampleWithReplacement. Using full array.');
    }
    var nInd = n;

    var currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array.slice(0, nInd);
  }

  /** Generate n random integers between [a, b)
  */
  /**
   * @param  {Number} - Minimum of the sampling interval
   * @param  {Number} - Maximum of the sampling interval
   * @param  {Number} - Number of samples to generate
   * @return {Number or Array[Number]} - Single sample or list of samples
   */
  function randomInt(a, b, n) {
    var randIntList = [];
    var minVal = Math.min(a, b);
    var maxVal = Math.max(a, b);
    for (var i = 0; i < n; i++) {
      randIntList.push(Math.floor(minVal + (maxVal - minVal) * Math.random()));
    }
    outVal = n == 1 ? randIntList[0] : randIntList;
    return outVal;
  }

  /**
   * Attempt to load the cached progress state from a JSON string in
   * local storage.
   *
   * @return {Boolean} - Indicates if restore was successful.
   */
  function restoreProgress() {
    var didRestore = false;
    if (storageBackend !== undefined && storageKey in storageBackend) {
      // Code for localStorage/sessionStorage
      headphoneCheckData = JSON.parse(storageBackend.getItem(storageKey));
      $(document).trigger('hcRestoreProgressSuccess');
      didRestore = true;
    }
    else {
      // No Web Storage support..
      $(document).trigger('hcRestoreProgressFail');
    }
    return didRestore;
  }

  /**
   * Store the data in headphoneCheckData to the storage object. The
   * storage backend (sessionStorage/localStorage) is defined by
   * the value in `storageBackend`.
   *
   * @return {undefined}
   */
  function storeProgress() {
    if (storageBackend !== undefined) {
      storageBackend.setItem(storageKey, JSON.stringify(headphoneCheckData));
      $(document).trigger('hcStoreProgressSuccess');
    }
    else {
      // No Web Storage support..
      $(document).trigger('hcStoreProgressFail');
    }
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


  // TODO: fix this, this doesn't work
  function parseAudioType(stimID) {
    console.log('TYPE: ' +stimID);
    console.log(headphoneCheckData.stimDataList);
    var typeStr = headphoneCheckData.stimDataList[stimID];
    console.log('TYPE: '+typeStr);
    if (typeStr === undefined) {
      typeStr = defaultAudioType;
    }
    console.log('TYPE: '+typeStr);
    return typeStr;
  }

}( window.HeadphoneCheck = window.HeadphoneCheck || {}, jQuery));



/***********************************/
/******** EXAMPLE USER CODE ********/
/***********************************/
$(document).ready(function() {
  $(document).on('hcStorageUnavailable', function(event, param1) {
    alert(event.type);
  });
  $(document).on('hcRestoreProgressSuccess', function(event, param1) {
    alert(event.type);
  });
  $(document).on('hcRestoreProgressFail', function(event, param1) {
    alert(event.type);
  });
  // $(document).on('hcLoadStimuliDone', function( event, param1) {
  //   alert( event.type );
  // });

  var headphoneCheckConfig = {
                               jsonPath: 'headphoneCheckDefaultStimuli.json',
                               totalTrials: 2,
                               trialsPerPage: 1,
                               correctThreshold: 1,
                               useSequential: true,
                               doShuffleTrials: true,
                               sampleWithReplacement: true,
                               doCalibration: false,
                               useCache: false,
                               debug: true,
                             };
  HeadphoneCheck.runHeadphoneCheck(headphoneCheckConfig);
});

