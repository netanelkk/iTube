import React, { useState, useRef, useEffect } from 'react'
import { useParams, Link } from "react-router-dom";
import { userDetails, subscribe, unsubscribe, totalviews } from "../../api";
import Videos from "./videos";
import Channels from "./channels";
import Error404 from "../errors/error404";
import { PCChannelHead, PCAbout } from "../placeholderComponents/channel"
import { upload } from "../../api";
import { graph } from './graph';
import ReactTooltip from 'react-tooltip';

function subButton() {
  return (<span title="subscribe"><i className="bi bi-plus-lg"></i><span>subscribe</span></span>);
}

function subedButton() {
  return (<span title="unsubscribe"><i className="bi bi-check-lg"></i><span>subscribed</span></span>);
}

function loadingText() {
  return (<><div className="loading" id="comment-loading"></div></>);
}

function loadingGraph() {
  return (<><div className="loading loading-graph"></div></>);
}

const SubscribeButton = ({userId, subscribeState, setRefreshSubs, setRefreshHead}) => {
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [subState, setSubState] = useState(subscribeState);

  const subscribeClick = React.useCallback(async () => {
    if(!buttonDisabled) {
      setSubState(-1);
      setButtonDisabled(true);
      const d = await subscribe(userId);
      setButtonDisabled(false);
      if (!d.pass) {
        setSubState(subscribeState);
        throw new Error("error");
      }else{
        setRefreshSubs(x => x+1);
        setRefreshHead(x => x+1);
        window.socket.emit('NEWNOTI', d.notiId);
      }
    }
  }, []);

  const unsubscribeClick = React.useCallback(async () => {
    if(!buttonDisabled) {
      setSubState(-1);
      setButtonDisabled(true);
      const d = await unsubscribe(userId);
      setButtonDisabled(false);
      if (!d.pass) {
        setSubState(subscribeState);
        throw new Error("error");
      }
      setRefreshSubs(x => x+1);
      setRefreshHead(x => x+1);
    }
  }, []);

  return ( <>
    { subState !== 0 &&
    <div className={"subscribe" + ((buttonDisabled || subState === 2) ? " disabled" : "")} 
    onClick={(subState == 1) ? subscribeClick : unsubscribeClick}>
      {(subState == 1) ? subButton() : "" }
      {(subState == 2) ? subedButton() : "" }
      {(subState == -1) ? loadingText() : "" }
    </div>
    }
    </>
  );
}

const ProfilePicture = ({picturePath, userId, setRefreshBar}) => {
  const inputFile = useRef(null);
  const profilePicker = useRef(null);
  const [pickerLabel, setPickerLabel] = useState("choose");
  const [allowToggle, setAllowToggle] = useState((userId === localStorage.getItem('myid')));
  const [allowPick, setAllowPick] = useState((userId === localStorage.getItem('myid')));
  const [profilePicture, setProfilePicture] = useState(picturePath);
  let fileSize = 0;

  const openPictureChooser = () => {
    inputFile.current.click();
  };

   const toggleChooser = (e) => {
    if(allowToggle)
       e.currentTarget.classList.toggle('showChooser');
  }

   const config = {
    onUploadProgress: progressEvent => setPickerLabel(parseInt(Math.round((progressEvent.loaded * 100) / progressEvent.total))+"%")
   }
   
   const uploadError = (mess) => {
    profilePicker.current.classList.add('picker-error');
    setPickerLabel(mess);
    setAllowToggle(false);
    fileSize = 0;
   }

   const uploadFinish = () => {
    setPickerLabel("choose");
    profilePicker.current.classList.remove('showChooser');
    fileSize = 0;
    setAllowToggle(true);
   }

const uploadPicture = async (e) => {
    profilePicker.current.classList.add('showChooser');
    profilePicker.current.classList.remove('picker-error');
    fileSize = e.target.files[0].size;
    if(fileSize > 1000000*2) {
      uploadError("Max size is 2mb");
      return;
    } 
    setPickerLabel("0%");

    const formData = { file: e.target.files[0], fileName: e.target.files[0].name};
    const res = await upload("/channel/picture", formData, config);
    if(res.pass) {
        uploadFinish();
        setProfilePicture(res.data.picturePath);
        setRefreshBar(x => x+1);
    }else{
        uploadError(res.msg.message);
    }
  }

  return (
  <div className='channel-profile' onMouseEnter={toggleChooser} onMouseLeave={toggleChooser} ref={profilePicker}>
  <img src={"" + window.SERVER + "/user_thumbnails/" + (profilePicture ? profilePicture : "default.png")} alt="profile-pic" />
  <div className='profile-picker' onClick={openPictureChooser} style={{display:(allowPick ? "block" : "none")}}>
    {pickerLabel}
    <input type="file" accept="image/png, image/gif, image/jpeg, image/webp" ref={inputFile} onChange={uploadPicture} />
  </div>
  </div>
  );
}

const ChannelHead = ({userId,setRefreshSubs,setChannelFound,isUserSignedIn,setTitle,setRefreshBar,setAbout}) => {
  const [refreshHead, setRefreshHead] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      const d = await userDetails(userId);
      setLoading(false);
      if (!d.pass) { 
        setData("error"); 
        setChannelFound(false); 
      }else{
        d.data[0].registerDate = new Date(d.data[0].registerDate).toLocaleDateString("he-IL");
        setChannelFound(true);
        setData(d.data[0]);
        setAbout(data.about);
        setTitle(d.data[0].username)
      }
    }
    setLoading(true);
    loadDetails();
  }, [userId, refreshHead]);

  return (
    <>
    {loading && <PCChannelHead />}
    {!loading && data === "error" && <Error404 />}
    {!loading && data !== "error" && 
    <div className="channel-head">
    <ProfilePicture userId={userId} picturePath={data.picturePath} isUserSignedIn={isUserSignedIn} setRefreshBar={setRefreshBar} />
    <div className="channel-name"><h2>{data.username}</h2>
    <div id="channel-info"><i className="bi bi-calendar-day"></i><span>{data.registerDate}</span>
    <span>&#183; {data.subscribers} subscribers</span></div></div>
    <SubscribeButton subscribeState={data.subscribeState} userId={userId} setRefreshSubs={setRefreshSubs} setRefreshHead={setRefreshHead} />
    </div> }
    </>
  );
};

const Tabs = ({channelId, pageId, setPageId, path}) => {

  useEffect(() => {
    let page = 1;
    if(path) {
      switch(path) {
        case "liked":
          page = 2;
          break;
        case "channels":
          page = 3;
          break;
        case "about":
          page = 4;
          break;
      }
    }
    setPageId(page);
  }, [path]);

  useEffect(() => {
    clearActive();
    if(pageId > 0)
    document.querySelectorAll('.tab-li')[pageId-1].classList.add("active");
  },[pageId]);

  const clearActive = () => {
    const collection = document.getElementsByClassName("tab-li");
    for(const c of collection) {
      c.classList.remove("active");
    }
  }

  return (
    <ul className='tab-menu'>
    <li className='tab-li'><Link to={window.PATH + "/channel/" + channelId}><div className='tab-item'>Videos</div><div className='tab-underline'></div></Link></li>
    <li className='tab-li'><Link to={window.PATH + "/channel/" + channelId+"/liked"}><div className='tab-item'>Liked Videos</div><div className='tab-underline'></div></Link></li>
    <li className='tab-li'><Link to={window.PATH + "/channel/" + channelId+"/channels"}><div className='tab-item'>Channels</div><div className='tab-underline'></div></Link></li>
    <li className='tab-li'><Link to={window.PATH + "/channel/" + channelId+"/about"}><div className='tab-item'>About</div><div className='tab-underline'></div></Link></li>
    </ul>
  );
}

const About = ({about, userId}) => {
  const graphRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getTotalviews = async () => {
      setLoading(true);
      const d = await totalviews(userId);
      setLoading(false);
      if (d.pass && graphRef.current) {
          let data = Object.keys(d.data[0]).map((k) => d.data[0][k]);
          let points = graph(graphRef.current, data);
          if(points.length > 1) {
          for(let i = 1; i <= points.length; i++) {
            document.getElementById("point"+i).style.left = (points[i-1].x-4)+"px";
            document.getElementById("point"+i).style.top = (points[i-1].y-4)+"px";
            document.getElementById("point"+i).setAttribute("data-tip",data[i-1] + " View" + (data[i-1]===1 ? "" : "s"));
          }
          ReactTooltip.rebuild();
         }
      }
    }
    graph(graphRef.current, [0], false);
    getTotalviews();
  }, []);

  return (
    <div className="channel channel-flex">
    <ReactTooltip />
    <div style={{flex:1}}>
    <h1 className='channel-about-title'>Total Views</h1>
    <div className="graph">
      {loading && <div className='loading-graph-wrap'>{loadingGraph()}</div> }
      <div className={"" + ((loading) ? "hide" : "")}>
    <div className='point' id="point1"></div><div className='point' id="point2"></div>
    <div className='point' id="point3"></div><div className='point' id="point4"></div>
    <div className='point' id="point5"></div><div className='point' id="point6"></div>
       </div>
    <canvas width="650" height="220" ref={graphRef}></canvas>
    </div>
    </div>
    <div style={{flex:1}}>
    <h1 className='channel-about-title about-title'>About</h1>
    { (about==="") ? <PCAbout /> : <p>{about}</p> }
    </div>
    </div>
  )
}

function Channel(props) {
  const { id } = useParams();
  const {setRefreshSubs,isUserSignedIn, setTitle, setRefreshBar, topRef} = props;
  const [channelFound, setChannelFound] = useState(false);
  const [pageId, setPageId] = useState(0);
  const [about, setAbout] = useState("");
  const path = window.location.pathname.replace(window.PATH,'').split("/")[3];

  useEffect(() => {
    topRef.current.scrollTop = 0;
  },[]);
  
  return (
    <>
      <ChannelHead userId={id} setRefreshSubs={setRefreshSubs} setTitle={setTitle} setAbout={setAbout}
      setPageId={setPageId} setChannelFound={setChannelFound} isUserSignedIn={isUserSignedIn} 
      setRefreshBar={setRefreshBar} />
      <Tabs pageId={pageId} setPageId={setPageId} channelId={id} path={path} />
    {channelFound && (pageId === 1 || pageId === 2) && 
          <Videos userId={id} key={"ch"+id+"tab"+pageId} tabpage={pageId} /> }
    {channelFound && pageId === 3 && <Channels userId={id} key={"ch"+id+"tab"+pageId} /> }
    {channelFound && pageId === 4 && <About about={about} userId={id} /> }
    </>
  );
}


export default React.memo(Channel);
