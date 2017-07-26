# headphone_check
Headphone check code

This can be tested locally by starting a HTTP server (eg. python simple HTTP server: run 'python -m SimpleHTTPServer 8000'). You can access a demo page at "localhost:8000/HeadphoneCheck.html"



Events:
=======
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
