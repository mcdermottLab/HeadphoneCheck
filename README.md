# HeadphoneCheck
Headphone check code

This can be tested locally by starting a HTTP server (eg. python simple HTTP server: run 'python -m SimpleHTTPServer 8000'). You can access a demo page at "localhost:8000/HeadphoneCheck.html"

For code support, bug fixes, or feature requests contact Ray Gonzalez raygon@mit.edu. For other issues, contact Kevin J. P. Woods kwoods@mit.edu.

## Overview
Setting up a headphone check requires the following steps:

1) [Source jQuery](#dependencies)
2) [Source HeadphoneCheck.js and HeadphoneCheck.css](#loading-headphonecheck) (alternatively, use our minified versions hosted on AWS S3)
3) [Create a div with the ID *"hc-container"*](#) in the HTML document where you want the headphone check to be rendered
4) Define what to do after the headphone check completes by attaching a listener to the *hcHeadphoneCheckEnd* event. 
5) Call *HeadphoneCheck.runHeadphoneCheck();* to begin the headphone check. To customize the headphone check, you can pass in an object of property:value pairs. For instance, a default headphone check without sound calibration can be run with *HeadphoneCheck.runHeadphoneCheck({doCalibration: false});*

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
          var headphoneCheckData = data.data;
          var headphoneCheckDidPass = data.didPass;
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
    <div id=hc-container></div>
  </body>
</html>
```

## Dependencies
HeadphoneCheck requires [jQuery](https://jquery.com). The code was tested using jQuery 1.8.3, but should work with newer versions.

## Loading HeadphoneCheck
HeadphoneCheck needs to be included with your scripts, e.g. in the head or at the end of the body.

The headphone check functionality is implemented in *HeadphoneCheck.js*. Some basic styling is provided by *HeadphoneCheckStyle.css*. 

If you decide that you don't want to host this code yourself, and you are okay with the standard headphone check, you can source these files from our AWS S3 server. The associated files are located at: 

+ *https://s3.amazonaws.com/mcd-headphone-check/v1.0/src/HeadphoneCheck.min.js*
+ *https://s3.amazonaws.com/mcd-headphone-check/v1.0/src/HeadphoneCheckStyle.css*

#### Example 1:
Within head tags, sourcing the code from localhost:

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

#### Example 2:
Within head tags, sourcing the code from our AWS S3 server:

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

To attach a listener to an event, 
