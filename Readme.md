#Ascii Cam

Simple camera stream converter to Ascii chars in plain JS


Minimum run requirements (see example2.html):

1. download repository

2. add video tag with id=asciiCam-source and width, height parameters as input source size
   (biger size == biger output size == worse performance)

3. add div tag with id=asciiCam-exitContainer as out stream container

4. run asciiCam().play() after DOM loaded

--------------------------------------------------------

More configuration (send as object parametr of acsiiCam call, see example.html):

    [exitCallback] - call on each camera frame with converted ascii data as input param,
    
    [sourceNode] - input video node,
    
    [audioOnFlag] - capture audio on/off,
    
    [showInputStream] - show camera stream view on/off,
    
    [streamWidth] - width of video node input stream,
    
    [streamHeight] - height of video node input stream


--------------------------------------------------------

You can config play/stop action that control camera stream:

- add asciiCam.play call to event emitter to start streaming
- add asciiCam.stop call to event emitter to stop streaming

[On line example (Firefox only)] (http://sumartur.cba.pl/asciiCam/) 



