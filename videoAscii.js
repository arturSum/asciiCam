
(function(global){


    var defaultConfig = {

            sourceNode :  null,
            audioOnFlag : false,

            exitCallback : ()=>{
                throw{

                    id : 5,
                    data : null
                }
            }



        },

        stopRenderLoop = true,
        rafId = null;










    var setUserMedia = ()=>{

            navigator.getUserMedia = navigator.getUserMedia ||
                                     navigator.webkitGetUserMedia ||
                                     navigator.mozGetUserMedia ||
                                     navigator.msGetUserMedia;


            return !!navigator.getUserMedia;
        },

        setWindowUrl = ()=>{

            window.URL = window.URL || window.webkitURL;

            return !!window.URL;
        },

        createCanvasNode = (parentNode, elWidth, elHeight)=>{


            var canvasElement = document.createElement('canvas');

            canvasElement.width = elWidth;
            canvasElement.height = elHeight;

            canvasElement.id = 'videoAscii-out-image';

            parentNode.appendChild(canvasElement);

            return canvasElement;
        },


        setParams = (userParams)=>{

            return{

                sourceNode : userParams.sourceNode &&
                             userParams.sourceNode instanceof HTMLElement &&
                             userParams.sourceNode.nodeName == 'video'? userParams.sourceNode : defaultConfig.sourceNode,

                audioOnFlag : userParams.audioOnFlag && typeof userParams.audioOnFlag == 'boolean'? userParams.audioOnFlag : defaultConfig.audioOnFlag,

                exitCallback : userParams.exitCallback && typeof  userParams.exitCallback == 'function'? userParams.exitCallback : defaultConfig.exitCallback


            }







        },



        setVideoStreams = (videoNode, audioOnFlag)=>{

            navigator.getUserMedia(

                {
                    video : {
                        width : {max:640},
                        height : {max:480}
                    },

                    audio : audioOnFlag
                },

                stream=>{

                    videoNode.src = window.URL.createObjectURL(stream);
                    videoNode.play();
                },

                error=>{

                    throw {
                        id : 1,
                        data : error
                    }

                }

            );

        };



    var drawFrame = (canvasCtx, videoNode, imgDataQnt, rowLength, asciiConversionCallback, exitCallback)=>{

            if(stopRenderLoop){

                cancelAnimationFrame(rafId);
                return;
            }


            canvasCtx.drawImage(videoNode, 0, 0);//dac info czy renderowac wejscie czy nie


            //window.postMessage("ddd", "http://localhost:63342");



            exitCallback(

                drawAsciiFrame(
                    canvasCtx.getImageData(0, 0, videoNode.width, videoNode.height).data,
                    imgDataQnt,
                    rowLength,
                    asciiConversionCallback
                )

            );



            rafId = requestAnimationFrame(()=>{
               drawFrame(canvasCtx, videoNode, imgDataQnt, rowLength, asciiConversionCallback, exitCallback);
            });


        },


        drawAsciiFrame = (imgData, imgDataQnt, rowLength, asciiConversionCallback)=>{

            var outputString = '',
                brightness = 0;


            for(var pixelNbr=0; pixelNbr<imgDataQnt; pixelNbr+=4){

                //convert to gray
                brightness = 0.34*imgData[pixelNbr] + 0.5*imgData[pixelNbr+1] + 0.16*imgData[pixelNbr+2];

                //add next line
                outputString += (pixelNbr>0 && (pixelNbr/4)%rowLength == 0)? '<br />' : '';


                //debugger;

                //add corresponding char
                outputString += asciiConversionCallback(brightness);

            }

            return outputString;
        },


        setBrightnessToCharCallback = (dir = 'normal')=>{

            //grayValue more == black
            if(dir == 'normal') {

                return function (grayValue) {

                    if (grayValue >= 230) {

                        return ' ';
                    }
                    else if (grayValue >= 200) {

                        return '.';
                    }
                    else if (grayValue >= 180) {

                        return '*';
                    }
                    else if (grayValue >= 160) {

                        return ':';
                    }
                    else if (grayValue >= 130) {

                        return 'o';
                    }
                    else if (grayValue >= 100) {

                        return '&';
                    }
                    else if (grayValue >= 70) {

                        return '8';
                    }
                    else if (grayValue >= 50) {

                        return '#';
                    }
                    else {

                        return '@';
                    }


                };

            }


            return function(grayValue){

                if (grayValue >= 230){

                    return '@';
                }
                else if(grayValue >= 200){

                    return '#';
                }
                else if(grayValue >= 180){

                    return '8';
                }
                else if(grayValue >= 160){

                    return '&';
                }
                else if(grayValue >= 130){

                    return 'o';
                }
                else if(grayValue >= 100){

                    return ':';
                }
                else if(grayValue >= 70){

                    return '*';
                }
                else if(grayValue >= 50){

                    return '.';
                }
                else{

                    return ' ';
                }

            }


        };



    var startConversion = (canvasCtx, videoNode, exitCallback)=>{

             var imgBuffer = canvasCtx.getImageData(0, 0, videoNode.width, videoNode.height).data,
                 asciiConversionCallback = setBrightnessToCharCallback();

             stopRenderLoop = false;

             var draw = drawFrame.bind(null,

                 canvasCtx,
                 videoNode,
                 imgBuffer.length,
                 (imgBuffer.length/videoNode.height)/4,
                 asciiConversionCallback,
                 exitCallback
             );


             draw();
        },

        stopConversion = ()=>{

            stopRenderLoop = true;
        };



    //##################################


    window.addEventListener('load', ()=>{

        defaultConfig.sourceNode = document.getElementById('videoAscii-source');

    });


    //##################################


    function videoAscii(config = {}){

        var {
                sourceNode,
                audioOnFlag,
                exitCallback
            } = setParams(config),

            canvasNode = null;




        //set required data
        if(!sourceNode){
            throw {

                id : 2,
                data : null
            }
        }


        if(!setUserMedia()){
            throw {

                id : 3,
                data : null
            }
        }

        if(!setWindowUrl()){
            throw {

                id : 4,
                data : null
            }
        }


        sourceNode.style.display = 'none';

        canvasNode = createCanvasNode(sourceNode.parentNode, sourceNode.width, sourceNode.height);

        setVideoStreams(sourceNode, audioOnFlag);











        return{

            play(){
                startConversion(canvasNode.getContext('2d'), sourceNode, exitCallback);
            },

            pause(){

                stopConversion();
            },

            stop(){

                stopConversion()
            }
        }


    }




    global.videoAscii = videoAscii.bind(this);

})(window);
