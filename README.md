# HeadphoneCheck
This code implements a headphone screening task intended to facilitate web-based experiments employing auditory stimuli. The efficacy of this screening task has been demonstrated in [Woods KJP, Siegel MH, Traer J & McDermott JH (2017) Headphone screening to facilitate web-based auditory experiments. *Attention, Perception & Psychophysics*](http://mcdermottlab.mit.edu/papers/Woods_etal_2017_headphone_screening.pdf)

As a screening task, it is intended to precede the main task(s), and should be placed at or near the beginning of an online experiment. Participants who pass are allowed through to the remainder of the experiment, but those who do not pass should instead be routed to an ending page and must leave the experiment after screening.

The task is a 3-AFC "Which tone is quietest?" task with 200Hz pure tones. Unbeknownst to the participant, a random one of the tones is in antiphase across the stereo channels, resulting in heavy attenuation only when heard over loudspeakers (but not over headphones). This results in very poor performance if the task is attempted without headphones. 

Six trials of this task, passing participants with >= 5 trials correct, appears sufficient to detect if a participant is using headphones or not (Woods et al. 2017), at least to a degree of accuracy acceptable for most practical purposes. Increasing the number of trials should only improve the accuracy of the screening (at the cost of participant time/pay). Decreasing the number of trials is **highly discouraged**! 

For code support, bug fixes, or feature requests contact Ray Gonzalez raygon@mit.edu.  
For other issues, contact Kevin J. P. Woods kwoods@mit.edu.

## Code Overview
Setting up a headphone screening requires the following steps:

1. [Source jQuery](#dependencies)
2. [Source HeadphoneCheck.js and HeadphoneCheck.css](#loading-headphonecheck-scripts) (alternatively, use our minified versions hosted on AWS S3)
3. [Create a div with the ID *"hc-container"*](#defining-headphonecheck-container) in the HTML document where you want the headphone check to be rendered
4. [Define what to do after the headphone check completes](#defining-what-to-do-after-headphone-check-completes) by attaching a listener to the *hcHeadphoneCheckEnd* event. 
5. [Call *HeadphoneCheck.runHeadphoneCheck();* to begin the headphone check](#configure-and-start-the-headphone-check). To customize the headphone check, you can pass in an object of property:value pairs. For instance, a default headphone check without sound calibration can be run with *HeadphoneCheck.runHeadphoneCheck({doCalibration: false});*

A minimal example of a headphone check follows:

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- 1) Import jQuery from Google CDN -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
    <!-- 2) Import HeadphoneCheck.js (minified) from McDermott S3 server -->
    <script type="text/javascript" src="https://s3.amazonaws.com/mcd-headphone-check/v1.0/src/HeadphoneCheck.min.js"></script>
    <!-- 2) Import HeadphoneCheck.css from McDermott S3 server -->
    <link rel="stylesheet" type="text/css" href="https://s3.amazonaws.com/mcd-headphone-check/v1.0/src/HeadphoneCheckStyle.css">

    <script>
      $(document).ready(function() {
        /* 4) Define what to do when the headphone check finishes */
        $(document).on('hcHeadphoneCheckEnd', function(event, data) {
          var headphoneCheckDidPass = data.didPass;
          var headphoneCheckData = data.data;
          var didPassMessage = headphoneCheckDidPass ? 'passed' : 'failed';
          alert('Screening task ' + '.');
        });

        var headphoneCheckConfig = {};
        /* 5) Run the headphone check, with customization options defined in headphoneCheckConfig */
        HeadphoneCheck.runHeadphoneCheck(headphoneCheckConfig);
      });
    </script>
  </head>
  <body>
    <!-- 3) Create a container div for the headphone check -->
    <div id="hc-container"></div>
  </body>
</html>
```

## Dependencies
HeadphoneCheck requires [jQuery](https://jquery.com). The code was tested using jQuery 1.8.3, but should work with newer versions.

## Loading HeadphoneCheck Scripts
The headphone check functionality is implemented in *HeadphoneCheck.js*. Some basic styling is provided by *HeadphoneCheckStyle.css*. These resources need to be included with your scripts, e.g. in the head or at the end of the body.

If you decide that you don't want to host this code yourself, and you are okay with the standard headphone check implementation, you can source these files from our AWS S3 server. The associated files are located at: 

+ https://s3.amazonaws.com/mcd-headphone-check/v1.0/src/HeadphoneCheck.min.js
+ https://s3.amazonaws.com/mcd-headphone-check/v1.0/src/HeadphoneCheckStyle.css

**Within head tags, sourcing the code from localhost:**
```html
<head>
  <!-- Import jQuery from Google CDN -->
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
  <!-- Import HeadphoneCheck.js -->
  <script type="text/javascript" src="HeadphoneCheck.js"></script>
  <!-- Import HeadphoneCheck.css -->
  <link rel="stylesheet" type="text/css" href="httpsHeadphoneCheckStyle.css">
</head>
```

**Within head tags, sourcing the code from our AWS S3 server:**
```html
<head>
  <!-- Import jQuery from Google CDN -->
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
  <!-- Import HeadphoneCheck.js (minified) from McDermott S3 server -->
  <script type="text/javascript" src="https://s3.amazonaws.com/mcd-headphone-check/v1.0/src/HeadphoneCheck.min.js"></script>
  <!-- Import HeadphoneCheck.css from McDermott S3 server -->
  <link rel="stylesheet" type="text/css" href="https://s3.amazonaws.com/mcd-headphone-check/v1.0/src/HeadphoneCheckStyle.css">
</head>
```

## Defining HeadphoneCheck Container
For now, the headphone check and all of the associated components will be rendered in an element with the ID *"hc-container"*. You'll need to create an element (e.g., a div element) with this ID in order to use the headphone check. This can be done in an HTML file or dynamically with Javascript or jQuery. 

**Statically defining headphone check container element:**
```html
<div id="hc-container"></div>
```

**Dynamically defining headphone check container element with jQuery:**
```javascript
$(document).ready(function() {
  $('<div/>', {
      id: 'hc-container',
    }).appendTo($('body'));
});
```

## Defining what to do after headphone check completes
Completing the headphone check will trigger a *hcHeadphoneCheckEnd* event via jQuery. You must define what happens after the headphone check completes by binding a callback to this event. The callback is a function that will be executed when the *hcHeadphoneCheckEnd* event occurs. If you do not bind a callback to the *hcHeadphoneCheckEnd* event, nothing will happen after the headphone check completes.

The *hcHeadphoneCheckEnd* event will pass two arguments to the callback function:

+ **event:** A jQuery.Event that contains information related to the event.
+ **data:** An Object that contains the following fields:
  + *didPass:* Boolean indicating if the headphone check was passed or failed, i.e., if the percentage of correct responses is at least as large as the correct threshold.
  + *data:* Object containing the responses and related data for this headphone check.
    + *didPass:* A Boolean indicating if the headphone check was passed or failed.
    + *totalCorrect:* Total number of correct responses.
    + *trialScoreList:* The participant's score (1 or 0) on each trail of the headphone check.
    + *responseList:* The list of responses generated by the experiment participant.
    + *stimIDList:* A list of IDs used to reference each stimulus trial in the DOM.
    + *stimDataList:* The list of objects containing URLs to the headphone check stimuli.
    + *calibration:* If sound calibration was performed, this contains the URL of the calibration sound.
    + *jsonData:* The raw data returned from the stimuli configuration JSON file, or the default stimulus configuration if no jsonPath URL was provided.
    + *pageNum:* A number of the current page (should be equal to *lastPage*).
    + *lastPage:* The last page of trials.
  + *config*: Object containing the configuration settings for this headphone check. See [configuration options](#configuration-options) for a description of these configuration parameters.

**Bind callback to alert user if headphone check was passed or failed:**
```javascript
$(document).ready(function() {
  $(document).on('hcHeadphoneCheckEnd', function(event, data) {
    var headphoneCheckDidPass = data.didPass;
    var headphoneCheckData = data.data;
    var didPassMessage = headphoneCheckDidPass ? 'passed' : 'failed';
    alert('Screening task ' + '. ' + headphoneCheckData.totalCorrect + 
    '/' + headphoneCheckData.stimIDList.length + ' trials correct');
  });
});
```

## Configure and start the headphone check
To begin the headphone check, you must call *HeadphoneCheck.runHeadphoneCheck();*. If no configuration object is provided as an argument to this function, the default headphone check, (the one described in the original paper) will be used. 

### Configuration Options
To customize the headphone check, you can pass in an object of property:value pairs. The complete list of options, along with their default parameters is provided below.
```javascript
headphoneCheckDefaultConfig = 
{
  jsonPath: undefined, // URL to json file containing stimulus/resource URLs
  totalTrials: 6, // Total number of trials
  trialsPerPage: 3, // Number of trials to render on a single page
  correctThreshold: 5/6, // Minimum percentage of correct responses required to pass the headphone screening.
  useSequential: true, // If true, trials must be completed in order from first to last.
  doShuffleTrials: true, // If true, the trials will be shuffled before presentation.
  sampleWithReplacement: false, // If true, the trials will be shuffled with replacement so that some trials might reoccur.
  doCalibration: true, // If true, play a calibration sound before beginning headphone screening task.
};
```
**Run a default headphone check**
```javascript
HeadphoneCheck.runHeadphoneCheck();
```

**Run a customized headphone check that uses [custom stimuli](#custom=-stimuli), no calibration, and only has 2 trials**
```javascript
HeadphoneCheck.runHeadphoneCheck({
  jsonPath: 'URL_TO_CUSTOM_JSON_STIMULI_CONFIG_FILE.JSON'
  doCalibration: false,
  totalTrials: 2
});
```
### Custom stimuli
If you'd like to use custom stimuli for the headphone check, you can do so by creating a JSON configuration file that contains the URLs to all of the required resources. The basic schema for a valid headphone check JSON file is below:

```javascript
{"stimuli": [
              {"id": "stim_id_1", "src": "stim_1_URL", "correct": "stim_1_correct_response"},
            ],
  "calibration": {"src": "calibration_URL"}
}
```

For instance (seem **demos** folder for more examples):
```javascript
{
  "stimuli":[
              {"id":1, "src": "../assets/antiphase_HC_ISO.wav", "correct":"2"},
              {"id":2, "src": "../assets/antiphase_HC_IOS.wav", "correct":"3"},
              {"id":3, "src": "../assets/antiphase_HC_SOI.wav", "correct":"1"},
              {"id":4, "src": "../assets/antiphase_HC_SIO.wav", "correct":"1"},
              {"id":5, "src": "../assets/antiphase_HC_OSI.wav", "correct":"2"},
              {"id":6, "src": "../assets/antiphase_HC_OIS.wav", "correct":"3"}
            ],
  "calibration": {"src": "../assets/noise_calib_stim.wav"}
}
```

## Events:
All events triggered by the headphone check code are jQuery events prefixed by "hc" and fired on document. The full set of events are listed below:

+ hcLoadStimuliSuccess
+ hcLoadStimuliFail
+ hcLoadStimuliDone
+ hcInitialized
+ hcCalibrationStart
+ hcCalibrationEnd
+ hcHeadphoneCheckStart
+ hcHeadphoneCheckEnd

To attach a listener to an event, use jQuery's *on* method. For instance:

```javascript
$(document).on('hcHeadphoneCheckStart', function(event, data) {
  //do something here
});
```

## Testing locally
This code can be tested locally by starting a HTTP server (eg. python simple HTTP server: run 'python -m SimpleHTTPServer 8000'). 
You can access a demo page at "http://localhost:8000/demos/HeadphoneCheckCustomized.html"
