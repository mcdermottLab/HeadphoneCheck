# headphone_check
Headphone check code

This can be tested locally by starting a http server (eg. python simple HTTP server: run 'python -m SimpleHTTPServer 8000'). You can access a demo page at "localhost:port/HeadphoneCheck.html"


Events:
=======
All events triggered by the headphone check code are prefixed by "hc" and fired on document.
+ hcLoadStimuliSuccess
+ hcLoadStimuliFail
+ hcLoadStimuliDone

+ hcInitialized

+ hcCalibrationStart
+ hcCalibrationEnd

+ hcHeadphoneCheckStart
+ hcHeadphoneCheckEnd
