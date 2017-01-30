
//font-family: 'Courier New'; font-size: 7px; line-height:70%

(function(global){

    var minStreamVal = {
            width : 100,
            height : 80
        },
        maxStreamVal = {
            width : 640,
            height : 480
        },

        defaultConfig = {

            sourceNode :  null,
            audioOnFlag : false,
            showInputStream : true,

            streamWidth : 400,
            streamHeight : 300,


            exitCallback : ()=>{
                throw{

                    id : 5,
                    msg : 'Can not find exitCallback function'
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

            global.URL = global.URL || window.webkitURL;

            return !!global.URL;
        },

        createCanvasNode = (sourceNode, elWidth, elHeight, displayFlag)=>{

            var canvasElement = document.createElement('canvas');

            canvasElement.width = elWidth;
            canvasElement.height = elHeight;

            canvasElement.id = 'videoAscii-out-image';

            if(!displayFlag){
                canvasElement.style.display = 'none';
            }

            sourceNode.parentNode.insertBefore(canvasElement, sourceNode.nextSibling);

            return canvasElement;
        },

        createExitNode = (parentNode)=>{

            var preElement = document.createElement('pre');

                preElement.style.fontFamily = "Courier New";
                preElement.style.fontSize = "1px";

            parentNode.appendChild(preElement);

            return preElement;
        },

        setParams = (userParams)=>{


            var exitCallback = (()=>{

                var exitContainerNode = document.getElementById('videoAscii-exitContainer'),
                    exitNode = null;


                if(exitContainerNode){

                    exitNode = createExitNode(exitContainerNode);

                    return function(data){

                        exitNode.innerHTML = data;
                    }

                }

                return userParams.exitCallback && typeof userParams.exitCallback == 'function'? userParams.exitCallback : defaultConfig.exitCallback;

            })(),



            sourceNode = ((minSize, maxSize)=>{


                var checkCorrectSizeOfNode = (nodeToCheck, minSize, maxSize)=>{


                    if(!(nodeToCheck.width && nodeToCheck.height)){

                        return false;
                    }

                    if(nodeToCheck.width < minSize.width || nodeToCheck.width > maxSize.width){

                        return false;
                    }


                    if(nodeToCheck.height < minSize.height || nodeToCheck.height > maxSize.height){

                        return false;
                    }


                    return true;
                };




                var setNodeSource = (sourceNode, minSize, maxSize, userParams, checkSizeCallback)=>{


                    if( checkSizeCallback(sourceNode, minSize, maxSize) ){

                        return sourceNode;
                    }


                    if(
                        userParams.streamWidth && userParams.streamHeight &&
                        userParams.streamWidth > minSize.width && userParams.streamWidth < maxSize.width &&
                        userParams.streamHeight > minSize.height && userParams.streamHeight < maxSize.height
                    ){

                        sourceNode.width = userParams.streamWidth;
                        sourceNode.height = userParams.streamHeight;

                    }
                    else{

                        sourceNode.width = defaultConfig.streamWidth;
                        sourceNode.height = defaultConfig.streamHeight;

                        console.info('Stream are oversized. Default settings was set');
                    }


                    return sourceNode;
                };



                //############################################################



                if(
                    userParams.sourceNode &&
                    userParams.sourceNode instanceof HTMLElement &&
                    userParams.sourceNode.nodeName.toLowerCase() == 'video'
                ){


                    return setNodeSource(
                        userParams.sourceNode,
                        minSize,
                        maxSize,
                        userParams,
                        checkCorrectSizeOfNode
                    );


                }
                else if(
                    defaultConfig.sourceNode &&
                    defaultConfig.sourceNode instanceof HTMLElement &&
                    defaultConfig.sourceNode.nodeName.toLowerCase() == 'video'
                ){

                    return setNodeSource(
                        defaultConfig.sourceNode,
                        minSize,
                        maxSize,
                        userParams,
                        checkCorrectSizeOfNode
                    );


                }


            })(minStreamVal, maxStreamVal);



            return{

                audioOnFlag : userParams.audioOnFlag && typeof userParams.audioOnFlag == 'boolean'? userParams.audioOnFlag : defaultConfig.audioOnFlag,

                showInputStream : userParams.showInputStream && typeof userParams.showInputStream == 'boolean'? userParams.showInputStream : defaultConfig.showInputStream,

                sourceNode,
                exitCallback

            }


        },



        setVideoStreams = (videoNode, audioOnFlag)=>{

            return new Promise((resolve, reject)=>{

                navigator.getUserMedia(

                    {
                        video : {
                            width : { max : 680 },
                            height : {max : 480}
                        },
                        audio : audioOnFlag
                    },

                    stream=>{

                        videoNode.src = window.URL.createObjectURL(stream);
                        videoNode.play();

                        resolve();
                    },

                    error=>{

                        reject(error);

                    }

                );


            });

        };



    var drawFrame = (canvasCtx, videoNode, imgDataQnt, rowLength, asciiConversionCallback, exitCallback)=>{

            if(stopRenderLoop){

                cancelAnimationFrame(rafId);
                return;
            }




            canvasCtx.drawImage(videoNode, 0, 0, videoNode.width, videoNode.height);



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
                outputString += (pixelNbr>0 && (pixelNbr/4)%rowLength == 0)? '\n' : '';

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


        },


        trySetControlAction = (actionStorage)=>{

            actionStorage.forEach(([nodeHandle, callback])=>{


                if(nodeHandle){

                    nodeHandle.addEventListener('click', ()=>{
                        callback();
                    });
                }

            });

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




        // defaultConfig.sourceNode.addEventListener('loadedmetadata', function(e){
        //
        //
        //     console.log(defaultConfig.sourceNode.videoWidth, defaultConfig.sourceNode.videoHeight);
        //
        // });


    });


    //##################################


    function videoAscii(config = {}){

        var {
                sourceNode,
                audioOnFlag,
                exitCallback,
                showInputStream
            } = setParams(config);



        //set required data
        if(!sourceNode){
            throw {

                id : 2,
                msg : 'Can not find source video node reference in config object'
            }
        }

        if(!setUserMedia()){
            throw {

                id : 3,
                msg : 'navigator.getUserMedia not supported'
            }
        }

        if(!setWindowUrl()){
            throw {

                id : 4,
                msg : 'window.URL not supported'
            }
        }



        sourceNode.style.display = 'none';

        var canvasNode = createCanvasNode(sourceNode, sourceNode.width, sourceNode.height, showInputStream),
            arePlayClicked = false;



        setVideoStreams(sourceNode, audioOnFlag).then(()=>{


            //wait for load metadata of video
            sourceNode.addEventListener('loadedmetadata', function(e){


                //redefine if play was clicked before stream loaded
                videoAscii.play = ()=>{

                    arePlayClicked = true;
                    startConversion(canvasNode.getContext('2d'), sourceNode, exitCallback);


                };


                if(arePlayClicked){
                    videoAscii.play();
                }


            });


        }).
        catch((reason)=>{

                throw {
                    id : 1,
                    msg : 'Set stream source error',
                    data : reason
                }

        });





        //################# set public out ##################


        videoAscii.play = ()=>{
            arePlayClicked = true;
        };

        videoAscii.stop = ()=>{

            arePlayClicked = false;
            stopConversion()
        };


        trySetControlAction([
            [document.getElementById('videoAscii-play'), videoAscii.play],
            [document.getElementById('videoAscii-stop'), videoAscii.stop]
        ]);



        return{

            play : videoAscii.play,
            stop : videoAscii.stop
        }


    }



    global.videoAscii = videoAscii;

})(window);
