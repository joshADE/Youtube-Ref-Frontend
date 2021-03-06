import React, { useState, useEffect, useRef } from 'react'
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { CustomInput, Form, FormGroup, Label, Input, Col, Button } from 'reactstrap';
import ReactPlayer from 'react-player';
import { getTime, clamp } from '../utility'
import VolumeIndicator from './misc/VolumeIndicator';
const { createSliderWithTooltip } = Slider;
const Range = createSliderWithTooltip(Slider.Range);




function VideoReferencer({
    video,
    setNewReference,
    handleVideoEnd,
    nextButtonText,
    nextButtonHandler
}) {
    const [isPaused, setPaused ] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [repeat, setRepeat] = useState(false);
    const videoRef = useRef();
    const [referenceType, setReferenceType] = useState(video.endSeconds?'range':'point');
    const [referenceName, setReferenceName] = useState(video.name?video.name:'');

    const [startPoint, setStartPoint] = useState(video.startSeconds ? video.startSeconds : 0);
    
    const [value, setValue] = useState(startPoint);
    const [videoDuration, setVideoDuration] = useState(60);
    const [endPoint, setEndPoint] = useState(video.endSeconds ? video.endSeconds : 40);

    useEffect(() => {
        if (videoRef.current){
            setVideoDuration(videoRef.current.getDuration());
            setEndPoint(clamp(endPoint, value, videoRef.current.getDuration()));
        }
    })

    useEffect(() => {
        console.log("start seconds", video.startSeconds);
        console.log("end seconds", video.endSeconds);
        console.log("start point", startPoint);
        console.log("end point", endPoint);
        
    }, [endPoint])
    
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (referenceType === 'point'){
            setNewReference(referenceName, Math.floor(startPoint));
        }else if (referenceType === 'range'){
            setNewReference(referenceName, Math.floor(startPoint), Math.floor(endPoint));
        }else{
            return;
        }
        nextButtonHandler();
    }
   

    const handleVolumeChange = (newvolume) => {
        setVolume(newvolume);
        
    }
    const handlePlaying = (e) => { 
        setPaused(false);  
        
    }
    const handlePause = (e) => {
        setPaused(true);
        
    }

    const handleReady = () => {
        if (videoRef.current){
            videoRef.current.seekTo(startPoint);
            setValue(startPoint);
        }
        if (video.endSeconds){
            setEndPoint(video.endSeconds);
        }
    }
    
    const handleEnd = () => {
        if (repeat){
            if (videoRef.current){
                videoRef.current.seekTo(startPoint);
                setValue(startPoint);
            }
        }else{
            handleVideoEnd();
        }
    }

    const handleSliderChange = (newvalue) => {
        if (newvalue[0]){
            setStartPoint(newvalue[0]);
        }
        if (newvalue[1]){
            setValue(newvalue[1]);
        }
        if (newvalue[2]){
            setEndPoint(newvalue[2]);
        }
        console.log(newvalue)
        if (videoRef.current){
            videoRef.current.seekTo(newvalue[1]);
        }
        //setPaused(false);
    }

    const handleProgress = (state) => {
        setValue(state.playedSeconds);

        // the range input doesn't support overlapping of handles (so endpoint - 1)
        if (referenceType === 'range' && state.playedSeconds >= endPoint - 1){ 
            if (videoRef.current){
                setPaused(true);
            }
        }
    }

    const handleTypeChange = (e) => {
        setReferenceType(e.target.value);
        if (e.target.value === 'range'){
            setEndPoint(value + videoDuration / 10); // endPoint is clamped above
        }
    }

    return (

        <div className="player">
            <ReactPlayer
                className="video" 
                url={video.url}
                width="100%"
                height="100%"
                controls={false}
                playing={!isPaused}
                onProgress={handleProgress}
                volume={volume}
                onPlay={handlePlaying}
                onPause={handlePause}
                onEnded={handleEnd}
                onReady={handleReady}
                ref={videoRef}
            />
            <div
                className="track"
            >
            <span
                className=""
            >{getTime(value)}</span>
            {' '} | {' '}
            <span
                className=""
            >{referenceName}</span>
            <Range
                min={0}
                max={videoDuration}
                value={(referenceType==='range')?[startPoint, value, endPoint]:[startPoint, value]}
                onChange={handleSliderChange}
                count={(referenceType==='range')?3:2}
                pushable={true}
                allowCross={true}
                tipFormatter={val => getTime(val)}
                handleStyle={[{}, {backgroundColor: 'paleturquoise'}]}
            
            />
            </div>
            <div 
                className="controls"
            >
                <Form
                    onSubmit={handleSubmit}
                >
                    <CustomInput 
                        type="switch" 
                        id="pauseSwitchReferencer"
                        label="Pause" 
                        checked={isPaused}
                        onChange={() => setPaused(!isPaused)}
                    />
                    <CustomInput 
                        type="switch"  
                        label="Repeat after video ends"
                        id="repeatSwitchReferencer" 
                        checked={repeat}
                        onChange={() => setRepeat(!repeat)}
                    />
                    <FormGroup check>
                        <VolumeIndicator 
                            min={0}
                            max={1}
                            value={volume}
                        />
                        <Slider 
                            className="volumeSlider"
                            min={0}
                            max={1}
                            value={volume}
                            step={0.1}
                            onChange={handleVolumeChange}
                        />
                    </FormGroup>
                    <br />
                    <FormGroup check>
                        <Label check>
                            <Input onChange={handleTypeChange} value="point" checked={referenceType === 'point'} type="radio" name="referenceType" />{' '}
                            Reference Point
                        </Label>
                    </FormGroup>
                    <br />
                    <FormGroup check>
                        <Label check>
                            <Input onChange={handleTypeChange} value="range" checked={referenceType === 'range'} type="radio" name="referenceType" />{' '}
                            Reference Range
                        </Label>
                    </FormGroup>
                    <br />
                    <FormGroup row>
                        <Label for="referenceName" sm={2}>Name</Label>
                        <Col sm={10}>
                            <Input type="text" name="referenceName" value={referenceName} onChange={(e) => setReferenceName(e.target.value)} id="referenceName" placeholder="Enter the reference name here" required/>
                        </Col>
                    </FormGroup>
                    <FormGroup row style={{ maxWidth: '450px'}}>
                        <Col sm={2}>
                            SP: {getTime(startPoint)}
                        </Col>
                        <Col style={{ maxWidth: '200px'}} sm={5}>
                            <Button onClick={() => setStartPoint(value)} outline color="secondary">Set start point to current played point</Button>
                        </Col>
                        <Col style={{ maxWidth: '200px'}} sm={5}>
                            <Button onClick={() => setStartPoint(0)} outline color="secondary">Set start point to beginning</Button>
                        </Col>
                    </FormGroup>
                    {referenceType === 'range' &&
                    <FormGroup row style={{ maxWidth: '450px'}}>
                        <Col sm={2}>
                            EP: {getTime(endPoint)}
                        </Col>
                        <Col style={{ maxWidth: '200px'}} sm={5}>
                            <Button onClick={() => setEndPoint(value)} outline color="secondary">Set end point to current played point</Button>
                        </Col>
                        <Col style={{ maxWidth: '200px'}} sm={5}>
                            <Button onClick={() => setEndPoint(videoDuration)} outline color="secondary">Set end point to end</Button>
                        </Col>
                    </FormGroup>
                    }

                    
                    
                    <FormGroup check row>
                        <Col sm={{ size: 5, offset: 2 }}>
                        <Input type="submit" value={nextButtonText}/>
                        </Col>
                    </FormGroup>
                </Form>
            </div>
        </div>
    )
}

export default VideoReferencer