import React, { useRef, useEffect, useState } from 'react'
import ReactTimeAgo from 'react-time-ago'
import { Link, useNavigate  } from "react-router-dom";
import { updatetitle, updateprivate, deletevideo } from "../../api";

const zeroPad = (num, places = 2) => String(num).padStart(places, '0')

function formatDuration(duration) {
    const minutes = Math.floor(duration/60);
    const seconds = duration%60;
    return zeroPad(minutes) + ":" + zeroPad(seconds);
}

const Correlation = ({corr}) => {
    const corrText = (c) => {
        return (c===0 ? "Recommended" : (c*100).toFixed(0)+"% Match")
    }
    return (<>
            {( (corr!==undefined) && <> <span className="corr">{corrText(corr)}</span></> )}
    </>);
}

const VideoSuggestion = ({video, isHistory, isLiked, isActive}) => {
    return (
        <Link to={window.PATH + "/watch/" + video.id}>
        <div className={((isHistory || isLiked) ? "history" : "suggest")+((isActive) ? " active" : "")}>
          <div className="suggest-pic" style={{backgroundImage:"url(" + window.SERVER + "/video_thumbnails/" + video.thumbnailPath + ")"}}>
          <div className="duration">{formatDuration(video.duration)}</div>
          </div>
          <div className="suggest-details">
            <span>{video.title}</span>
          <div className="creator">
            <img src={"" + window.SERVER + "/user_thumbnails/" + (video.picturePath ? video.picturePath : "default.png") }  alt="profile" />
            <span>{video.username}</span> { (!isLiked) ? <>&#183;</> : ""} {(isHistory) ? (<span className='suggest-time'>Watched </span>) : "" } 
            {!isLiked && <ReactTimeAgo date={(isHistory) ? Date.parse(video.historyDate) : Date.parse(video.uploadDate)} locale="en-US" className="suggest-time"/>}
          </div>
          </div>
          </div>
          </Link>
    );
}

function loadingText() {
    return (<><div className="loading" id="comment-loading"></div></>);
}

const Delete = ({setDiscard, videoId, videoBox, setCount}) => {
    const editDeleteRef = useRef(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        function handleClickOutside(event) {
          if (editDeleteRef.current && !editDeleteRef.current.contains(event.target)) {
            setDiscard(x => x + 1);
          }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [editDeleteRef]);


    async function deleteVideo() {
        setLoading(true);
        const deleteResult = await deletevideo({ videoId }); 
        if(!deleteResult.pass) {
             alert(deleteResult.msg);
        }else{
            setCount(x => x - 1);
            videoBox.current.classList.add('hide');
        }
        setDiscard(x => x + 1);
    }

    return (<div className='title-edit' ref={editDeleteRef}>
             <h3 className="subtitle">Are You Sure?</h3>
             {!loading && <><button className='submit' id="delete-video" onClick={deleteVideo}>Delete Video</button> <button className='submit' onClick={() => setDiscard(x => x + 1)}>Abort</button></> }
             {loading && loadingText()}
        </div>
    )
}


const MakePrivate = ({setDiscard, videoId, locked, setLocked}) => {
    const editPrivateRef = useRef(null);
    const [password, setPassword] = useState("");
    const onPasswordChange = (event) => { setPassword(event.target.value); };
    const [loading, setLoading] = useState(false);
    const [privateChecked, setPrivateChecked] = useState(locked); 

    const privateSubmit = (e) => {
        e.preventDefault();
        change();
    }

    useEffect(() => {
        function handleClickOutside(event) {
          if (editPrivateRef.current && !editPrivateRef.current.contains(event.target)) {
            change();
          }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [editPrivateRef, privateChecked, password]);


    async function change() {
        setLoading(true);
        let pw = password;
        if(!privateChecked) { pw = ""; setPassword(pw); }
        const updateResult = await updateprivate({ videoId, password: pw, privateChecked }); 
        if(!updateResult.pass) {
             alert(updateResult.msg);
        }  
        if(!(privateChecked && pw==''))
            setLocked(pw!=='');
        setDiscard(x => x + 1);
    }

    const privateChange = () => {
        setPrivateChecked(!privateChecked); 
    }

    return (<div className='title-edit' ref={editPrivateRef}>
        <form onSubmit={privateSubmit}>
             <h3 className="subtitle">Private Video</h3>
             {!loading && <>
                <label className='custom-option' htmlFor="private">
                <input type="checkbox" id="private" onChange={privateChange} defaultChecked={locked} />
                <span className="checkmark"></span>
                <span>Private</span>
                </label>
                {privateChecked && <input type="password" className="input" value={password}
                placeholder="Enter Password For Video"
                onChange={onPasswordChange} maxLength="20" autoFocus required />}
                </>
             }
             {loading && loadingText()}
        </form>
        </div>
    )
}

const EditTitle = ({videoTitle, setVideoTitle, setDiscard}) => {
    const editTitleRef = useRef(null);
    const [videoEditTitle, setVideoEditTitle] = useState(videoTitle);
    const onVideoEditTitleChange = (event) => { setVideoEditTitle(event.target.value); };
    const [loading, setLoading] = useState(false);

    const editTitleSubmit = (e) => {
        e.preventDefault();
        change();
    }

    useEffect(() => {
        function handleClickOutside(event) {
          if (editTitleRef.current && !editTitleRef.current.contains(event.target)) {
            change();
          }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [editTitleRef, videoEditTitle]);

    function change() {
        if(videoEditTitle === videoTitle || videoEditTitle === "") {
            setDiscard(x => x + 1);
        }else{
            setLoading(true);
            setVideoTitle(videoEditTitle);
        }
    }

    return (<div className='title-edit' ref={editTitleRef}>
        <form onSubmit={editTitleSubmit}>
             <h3 className="subtitle">Edit Title</h3>
             {!loading && <input type="text" className="input" value={videoEditTitle}
                onChange={onVideoEditTitleChange} maxLength="100" autoFocus required />}
             {loading && loadingText()}
        </form>
        </div>
    )
}

export default function VideoBox(props) {
    const videoMenu = useRef(null);
    const videoBox = useRef(null);
    const { video, col, index, hidePublisher, setCount, userId } = props;
    const navigate = useNavigate();
    const [videoTitle, setVideoTitle] = useState(video.title);
    const [showEditTitle, setShowEditTitle] = useState(false);
    const [showPrivate, setShowPrivate] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [discard, setDiscard] = useState(0);
    const [locked, setLocked] = useState(video.password==="LOCKED")
    const allowEdit = (localStorage.getItem("myid") === userId);

    const editTitleClick = () => {
        discardAll();
        setShowEditTitle(true);
    }
    const privateClick = () => {
        discardAll();
        setShowPrivate(true);
    }
    const deleteClick = () => {
        discardAll();
        setShowDelete(true);
    }

    const togglePublisher = (e) => { 
        e.currentTarget.classList.toggle('active');
    };

    const openMenu = (e) => {
        e.preventDefault();
        videoMenu.current.classList.add('show');
    }
    const closeMenu = () => {
        videoMenu.current.classList.remove('show');
    };

    useEffect(() => {
      function handleClickOutside(event) {
        if (videoMenu.current && !videoMenu.current.contains(event.target)) {
            closeMenu();
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [videoMenu]);

    useEffect(() => {
        discardAll();
    }, [discard]);

    useEffect(() => {
        async function update() {
            const updateResult = await updatetitle({ videoId: video.id, title: videoTitle }); 
            if(!updateResult.pass) {
                alert(updateResult.msg);
            }  
            video.title = videoTitle;
            discardAll();
        }
        if(video.title != videoTitle)
            update();
    }, [videoTitle]);

    function discardAll() {
        closeMenu();
        setShowEditTitle(false);
        setShowPrivate(false);
        setShowDelete(false);
    }
      
  return (
    <div className={("col-xl-"+((index===0) ? "12" : col)) + " " +
                    ("col-lg-"+((index===0) ? "12" : "4")) + " " +
                    ("col-md-"+((index===0) ? "12" : "6")) } ref={videoBox}>

        {showEditTitle && <EditTitle videoTitle={videoTitle} setVideoTitle={setVideoTitle} setDiscard={setDiscard} /> }
        {showPrivate && <MakePrivate setDiscard={setDiscard} videoId={video.id} locked={locked} setLocked={setLocked} /> }
        {showDelete && <Delete setDiscard={setDiscard} videoId={video.id} setCount={setCount} videoBox={videoBox} /> }
        
        { (allowEdit && hidePublisher) ?
        <ul className='video-menu' ref={videoMenu}>
            <li onClick={editTitleClick}><i className="bi bi-pencil-square"></i> Edit Title</li>
            <li onClick={privateClick}><i className="bi bi-shield-lock"></i> Make Private</li>
            <li onClick={deleteClick}><i className="bi bi-trash"></i> Delete</li>
        </ul> : <div ref={videoMenu}></div> }

        <Link to={window.PATH + "/watch/" + video.id}>
            <div className={"video-box" + ((index===0) ? " big-box" : "")} onMouseEnter={togglePublisher} onMouseLeave={togglePublisher}>
                <div className="video-pic" style={{backgroundImage:"url(" + window.SERVER + "/video_thumbnails/" + video.thumbnailPath + ")"}}>
                    {!hidePublisher && <div role='link' onClick={ (e) => {e.preventDefault(); navigate(window.PATH + "/channel/" + video.userId); } } ><div className="creator">
                        <img src={"" + window.SERVER + "/user_thumbnails/" + (video.picturePath ? video.picturePath : "default.png") } alt="profile"/>
                        <span>{video.username}</span>
                    </div></div>}
                    {(allowEdit && hidePublisher) &&
                    <>
                        <div className="creator" onClick={openMenu}>
                        <i className="bi bi-three-dots"></i>
                        </div>
                    </>
                    }
                   <div className="duration">{formatDuration(video.duration)}</div>
                </div>
                <div className="video-desc">
                    <h2>{locked && <i className="bi bi-lock-fill"></i>} {videoTitle}</h2>
                    <span>{video.views} Views <span className='dot-padding'>&#183;</span> <ReactTimeAgo date={Date.parse(video.uploadDate)} locale="en-US"/><Correlation corr={video.corr}/></span>
                </div>
            </div>
        </Link>
    </div>
  );
}

export { VideoSuggestion };
