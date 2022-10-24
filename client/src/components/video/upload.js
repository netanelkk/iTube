import React, { useState, useRef, useEffect } from 'react'
import { Link } from "react-router-dom";
import { upload } from "../../api";
import ErrorLogin from "../errors/errorLogin";
import { Player } from 'video-react';
import Alert from "../errors/alert";
import ReactTooltip from 'react-tooltip';

const filePlaceholder = "CHOOSE VIDEO TO UPLOAD";
function uploadText() {
    return (<><span><i className="bi bi-arrow-up-short"></i> Upload</span></>);
}

function loadingText(percent=0) {
    return (<><div className="loading"></div><span>Uploading.. {percent}%</span></>);
}

function Upload({isUserSignedIn, setTitle, topRef}) {
    setTitle("Upload Video");
    const inputFile = useRef(null);
    const [title,setVTitle] = useState("");
    const [description,setDescription] = useState("");
    const [password,setPassword] = useState("");
    const [alertMessage, setAlertMessage] = useState("");
    const [fileError, setFileError] = useState("");
    const [file, setFile] = useState("");
    const [fileName, setFileName] = useState(filePlaceholder);
    const [buttonText, setbuttonText] = useState(uploadText);
    const [disabled, setDisabled] = useState("");
    const [uploadedId, setUploadedId] = useState(0);
    const [thumbnailPath, setThumbnailPath] = useState("");
    const [step, setStep] = useState(0);
    const [preview, setPreview] = useState("");

    const onTitleChange = (event) => setVTitle(event.target.value);
    const onDescriptionChange = (event) => setDescription(event.target.value);
    const onPasswordChange = (event) => setPassword(event.target.value);
    const closeError = () => setAlertMessage("");

    function loading(show=true) {
        if(show) {
            setDisabled("disabled");
            setbuttonText(loadingText());
            setAlertMessage("");
        }else{
            setDisabled("");
            setbuttonText(uploadText());
        }
    }

    const fileChange = (e) => {
        setAlertMessage("");
        setFileName(filePlaceholder);
        setFile("");
        setPreview("");
        setFileError("");
        var file = e.target.files[0];
        if(file.size > 1000000*10) {
            setFileError("Max size is 10mb");
          return;
        } 
        if(file.type !== "video/webm" && file.type !== "video/mp4") {
            setFileError("Only mp4 and webm formats are allowed");
            return;
        }
        setFile(e.target.files[0]);
        setFileName(e.target.files[0].name);
        URL.revokeObjectURL(preview);
        var fileUrl = window.URL.createObjectURL(e.target.files[0]);
        setPreview(fileUrl);
        setStep(1);
    }

    const config = {
        onUploadProgress: progressEvent => setbuttonText(loadingText(parseInt(Math.round((progressEvent.loaded * 100) / progressEvent.total))))
    }

    const uploadSubmit = async (e) => {
        e.preventDefault();
        if(file) {
            loading();
            const formData = {title, description, password, file, fileName};
            const res = await upload("/watch/upload", formData, config);
            if(res.pass) {
                URL.revokeObjectURL(preview);
                setPreview("");
                setUploadedId(res.data.id);
                setThumbnailPath(res.data.thumbnailPath);
                res.data.notiId.forEach(user => {
                    window.socket.emit('NEWNOTI', user);
                });
            }else{
                setAlertMessage("Unexpected error, try again later");
            }
            loading(false);
        }
    }

    useEffect(() => {
        topRef.current.scrollTop = 0;
      },[]);

  return (
    <>
    { !isUserSignedIn && <ErrorLogin /> }
    { (alertMessage !== '') && <Alert message={alertMessage} close={closeError} /> }

    { (uploadedId !== 0 && isUserSignedIn) && 
        <div className='upload-success'>
            <div>
            <i class="bi bi-check-circle"></i>
            <div>Video Uploaded Successfully!</div>
            <Link to={window.PATH + "/watch/"+uploadedId}>
            <div className='upload-result'>
                <img src={window.SERVER + "/video_thumbnails/" + thumbnailPath} />
                <div>{title}</div>
            </div>
            </Link>
            </div>
        </div> }
        
    { (uploadedId === 0 && isUserSignedIn) && (
        <form className='upload-form' onSubmit={uploadSubmit}>
        <h1>Upload Video</h1>
        <div className='upload-menu'>
            <div className='step-line'></div>
            <div>
                <div className={'step' + ((step===0) ? " current" : "")} onClick={() => setStep(0) }>
                <div className='step-indicator'></div>
                <span>Choose Video</span>
                </div>
            </div>
            <div>
                <div className={'step' + ((step===1) ? " current" : "") + (!preview ? " disabled" : "")} onClick={() => { if(preview) setStep(1); } }>
                    <div className='step-indicator'></div>
                    <span>Video Details</span>
                </div>
            </div>
        </div>
        {(step===0) && 
        <div className='upload-box'>
             <i className="bi bi-upload"></i>
             <div>{fileName}</div>
             <input type="file" accept="video/mp4, video/webm" ref={inputFile} onChange={fileChange} />
             { (fileError !== '') && (
            <div className="fileError">
                {fileError}
            </div>
              )}
        </div>
        }
        {(step===1) && <>
            <Player
                src={preview}
                fluid={false}
                width="500"
                autoPlay={true}
                muted={true}
                />
            <input type="text" className="input" id="upload-title" placeholder="title" maxLength="100"
                     value={title} onChange={onTitleChange} style={{marginTop: "15px"}} required />
            <h3 className="subtitle">Description</h3>
            <textarea placeholder='Write here..' className="input" maxLength="255"
            onChange={onDescriptionChange} value={description} required />
            <ReactTooltip />
            <h3 className="subtitle">Password <i className="bi bi-question-circle-fill" data-tip="Upload private video protected with password"></i></h3>
            <input type="text" className="input" placeholder="optional" maxLength="20"
            value={password} onChange={onPasswordChange} />

        <button className="submit" disabled={disabled}>{buttonText}</button>
        </>
        }
        </form> )}
    </>
  );
}

export default Upload;
