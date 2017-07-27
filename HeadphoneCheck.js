/***
BSD 2-Clause License

Copyright (c) 2017, The HeadphoneCheck Authors (see AUTHORS)
All rights reserved.

Contact Ray Gonzalez raygon@mit.edu or Kevin J. P. Woods kwoods@mit.edu
=======================================================================
***/

(function(HeadphoneCheck, $, undefined) {
  /*** PRIVATE CONFIGURATION VARIABLES ***/
  var validColor = 'black';
  var warningColor = 'red';
  var requirePlayback = true;
  var st_isPlaying = false;
  var headphoneCheckData = {pageNum: 0,
                            stimIDList: [],
                            stimDataList: [],
                            trialScoreList: [],
                            responseList: [],
                            calibration: [],
                            jsonData: undefined,
                            lastPage: undefined,
                            totalCorrect: undefined,
                            didPass: undefined,
                           };
  var headphoneCheckConfig = {};
  // NOTE: DON'T CHANGE VALUES HERE. Use a similar config object to
  // override any default values you wish to change.
  var headphoneCheckDefaultConfig = {jsonPath: undefined,
                              totalTrials: 6,
                              trialsPerPage: 3,
                              correctThreshold: 5/6,
                              useSequential: true,
                              doShuffleTrials: true,
                              sampleWithReplacement: true,
                              doCalibration: true,
                              debug: false,
                             };

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
      HeadphoneCheck.renderHeadphoneCheckCalibration();
    });
    $(document).on('hcCalibrationEnd', function(event, data) {
      $(document).trigger('hcHeadphoneCheckStart', {'data': headphoneCheckData, 'config': headphoneCheckConfig});
    });

    $(document).on('hcHeadphoneCheckStart', function(event, data) {
      HeadphoneCheck.renderHeadphoneCheckPage();
    });
    // user needs to bind callback to hcHeadphoneCheckEnd event
    HeadphoneCheck.loadStimuli(headphoneCheckConfig.jsonPath);
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
    function parseLoadedStimuli(event, data) {
      var trialData = data.data;
      headphoneCheckData.jsonData = trialData;
      if (headphoneCheckConfig.doShuffleTrials) {
        shuffleTrials(trialData.stimuli, headphoneCheckConfig.totalTrials, headphoneCheckConfig.sampleWithReplacement);
      }
      if (headphoneCheckConfig.doCalibration) {
        headphoneCheckData.calibration = trialData.calibration;
      }
      headphoneCheckData.lastPage = Math.ceil(headphoneCheckData.stimDataList.length / headphoneCheckConfig.trialsPerPage);
      if (headphoneCheckConfig.doCalibration) {
        $(document).trigger('hcCalibrationStart', {'data': headphoneCheckData, 'config': headphoneCheckConfig});
      }
      else {
        $(document).trigger('hcHeadphoneCheckStart', {'data': headphoneCheckData, 'config': headphoneCheckConfig});
      }
    }

    $(document).on('hcLoadStimuliSuccess', parseLoadedStimuli);

    if (jsonPath === undefined) {
      var data = {'stimuli':[
                    {'id': 1, 'src': 'https://s3.amazonaws.com/mcd-headphone-check/v1.0/assets/antiphase_HC_ISO.wav', 'correct': '2'},
                    {'id': 2, 'src': 'https://s3.amazonaws.com/mcd-headphone-check/v1.0/assets/antiphase_HC_IOS.wav', 'correct': '3'},
                    {'id': 3, 'src': 'https://s3.amazonaws.com/mcd-headphone-check/v1.0/assets/antiphase_HC_SOI.wav', 'correct': '1'},
                    {'id': 4, 'src': 'https://s3.amazonaws.com/mcd-headphone-check/v1.0/assets/antiphase_HC_SIO.wav', 'correct': '1'},
                    {'id': 5, 'src': 'https://s3.amazonaws.com/mcd-headphone-check/v1.0/assets/antiphase_HC_OSI.wav', 'correct': '2'},
                    {'id': 6, 'src': 'https://s3.amazonaws.com/mcd-headphone-check/v1.0/assets/antiphase_HC_OIS.wav', 'correct': '3'}
                  ],
        'calibration': {'src': 'https://s3.amazonaws.com/mcd-headphone-check/v1.0/assets/noise_calib_stim.wav'}
      };
      var status = 'loadedDefault';
      var error;
      $(document).trigger('hcLoadStimuliSuccess', {'data': data, 'config': headphoneCheckConfig, 'status': status, 'error': error});
    }
    else {
      $.ajax({
          dataType: 'json',
          url: jsonPath,
          async: true,
          success: function (data, status, error) {
            $(document).trigger('hcLoadStimuliSuccess', {'data': data, 'config': headphoneCheckConfig, 'status': status, 'error': error});
          },
          error: function (data, status, error) {
            $(document).trigger('hcLoadStimuliFail', {'data': data, 'config': headphoneCheckConfig, 'status': status, 'error': error});
          },
          complete: function (data, status, error) {
            $(document).trigger('hcLoadStimuliDone', {'data': data, 'config': headphoneCheckConfig, 'status': status, 'error': error});
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

    if (headphoneCheckConfig.debug) console.log(headphoneCheckData);

    //get the stimuli to display on this page
    for (i = 0; i < headphoneCheckConfig.trialsPerPage; i++) {
      var trialInd = headphoneCheckData.pageNum * headphoneCheckConfig.trialsPerPage + i;
      if (trialInd < headphoneCheckConfig.totalTrials) {
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
        for (stimID = 0; stimID < headphoneCheckConfig.trialsPerPage; stimID++) {
          var trialInd = headphoneCheckData.pageNum * headphoneCheckConfig.trialsPerPage + stimID;
          var response = getResponseFromRadioButtonGroup(headphoneCheckData.stimIDList[trialInd]);
          scoreTrial(trialInd, headphoneCheckData.stimDataList[trialInd], response);
        }
        if (canContinue) { // Advance the page
          if (headphoneCheckData.pageNum == headphoneCheckData.lastPage - 1) {// TODO: -1 for indexing; make indexing consistent
            // handle edge case of first page is last page
            if (headphoneCheckConfig.totalTrials == 1 && headphoneCheckData.trialScoreList[0] === undefined) {
              renderResponseWarnings();
              return;
            }
            teardownHTMLPage();
            var didPass = checkPassFail(headphoneCheckConfig.correctThreshold);

            // add some data to the response object
            headphoneCheckData.totalCorrect = getTotalCorrect(headphoneCheckData.trialScoreList);
            headphoneCheckData.didPass = didPass;
            $(document).trigger('hcHeadphoneCheckEnd', {'didPass': didPass, 'data': headphoneCheckData, 'config': headphoneCheckConfig});
          }
          else {
            teardownHTMLPage();
            headphoneCheckData.pageNum++;
            HeadphoneCheck.renderHeadphoneCheckPage();
          }
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
        st_isPlaying = false;
        teardownHTMLPage();
        $(document).trigger('hcCalibrationEnd', {'data': headphoneCheckData, 'config': headphoneCheckConfig});
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
    if (headphoneCheckConfig.debug) console.log('--->' +' '+ stimDiv + ' ' + stimID + ', ' + stimFile);
    if (stimFile === undefined) return;
    var divID = 'hc-stim-' + stimID;
    $('<div/>', {id: divID, class: 'hc-trial-div'}).appendTo(('#' + stimDiv));

    //add in the audio source
    $('<audio/>', {
        id: 'hc-audio-' + stimID,
        src: stimFile
      }).appendTo($('#' + divID));

    if (headphoneCheckConfig.debug) {
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
    if (configData === undefined) {
      $.each(headphoneCheckDefaultConfig, function(index, defaultVal) {
        headphoneCheckConfig[index] = defaultVal;
      });
    }
    else {
      $.each(headphoneCheckDefaultConfig, function(index, defaultVal) {
        headphoneCheckConfig[index] = index in configData ? configData[index] : defaultVal;
      });
    }
    // normalize correctThreshold to a percentage
    if (headphoneCheckConfig.correctThreshold < 0) throw new Error('headphoneCheckConfig.correctThreshold must be positive.');
    if (headphoneCheckConfig.correctThreshold > 1) headphoneCheckConfig.correctThreshold /= headphoneCheckConfig.stimIDList.length;
  }

  /**
   * Initialize the headphone check and setup the environment.
   *
   * @return {undefined}
   */
  function setupHeadphoneCheck() {
    // pedantic sanity checking headphoneCheckConfig.totalTrials
    if (headphoneCheckConfig.totalTrials <= 0) throw new Error('headphoneCheckConfig.totalTrials must be positive.');
    if (headphoneCheckConfig.trialsPerPage <= 0) throw new Error('headphoneCheckConfig.trialsPerPage must be positive.');
    // if (headphoneCheckConfig.totalTrials < headphoneCheckConfig.trialsPerPage) throw new Error('headphoneCheckConfig.totalTrials cannot be less than headphoneCheckConfig.trialsPerPage.');
    if (headphoneCheckConfig.correctThreshold > headphoneCheckConfig.totalTrials) throw new Error('headphoneCheckConfig.correctThreshold cannot be greater than headphoneCheckConfig.totalTrials.');

    $(document).trigger('hcInitialized', {'data': headphoneCheckData, 'config': headphoneCheckConfig});
  }

  /**
   * Setup and execute the logic required for headphone check stimulus
   * playback.
   *
   * @param  {String} - ID of the stimulus element to play
   * @return {undefined}
   */
  function playStim(stimID) {
    var trialID = /trial(\d+)/.exec(stimID)[1]; // this is brittle
    var previousTrialID = trialID - 1;
    if (headphoneCheckConfig.useSequential && previousTrialID >= 0) {
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
   * Check that each question has a response.
   *
   * @return {undefined}
   */
  function checkCanContinue() {
    // TODO: This is HACKY and probably isn't the best idea
    var numResponses = $('.hc-buttonset-vertical>label>input[type=radio]:checked').length;
    var numRenderedTrials = $('.hc-buttonset-vertical').length;
    return numResponses >= numRenderedTrials;
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
    var totalCorrectPercentage = totalCorrect / headphoneCheckData.stimIDList.length;
    return totalCorrectPercentage >= correctThreshold;
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
    return $('#hc-radio-buttonset-'+elemID+'>label>input:checked').val();
  }

  function shuffleTrials(trialArray, n, withReplacement) {
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

}( window.HeadphoneCheck = window.HeadphoneCheck || {}, jQuery));
