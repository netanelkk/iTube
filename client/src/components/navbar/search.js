import React, { useEffect, useState, useRef } from 'react'
import { fetchNotifications, mydetails, suggestion, notificationsView } from "../../api";
import Login from "../login"
import { VideoSuggestion } from "../video/videoBox"
import { useNavigate } from "react-router-dom";
import { PCNotifications } from '../placeholderComponents/search'
import ReactTimeAgo from 'react-time-ago'
import { Link } from "react-router-dom";

var sugIndexValue = -1;
const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggetions] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sugIndex, setSugIndex] = useState(sugIndexValue);
  const [showSearch, setShowSearch] = useState(false);
  const inputRef = useRef(null);

  const navigate = useNavigate();
  const onQueryChange = (event) => {
    setShowSuggetions(true);
    setSearchQuery(event.target.value);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if(searchQuery !== "") {
      setShowSuggetions(false);
      inputRef.current.blur();
      if(sugIndexValue < 0 || sugIndexValue === 4) {
        navigate(window.PATH+"/search/"+encodeURIComponent(encodeURIComponent((searchQuery))));
      }else{
        navigate(window.PATH+"/watch/"+data[sugIndexValue].id);
      }
      setSugIndex(-1);
      sugIndexValue = -1;
    }
  };

  useEffect(() => {
    const getSuggestions = async () => {
      setLoading(true);
      const d = await suggestion(searchQuery);
      if (!d.pass) {
        setLoading(false);
        setShowSuggetions(false);
      }else{
        setData(d.data);
        setLoading(false);
      }
    }
    if(searchQuery !== "")
      getSuggestions();
    else
      setShowSuggetions(false);
  }, [searchQuery]);

  const wrapperRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggetions(false);
        setSugIndex(-1);
        sugIndexValue = -1;
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);


  const onKeyPressed = (e) => {
    switch(e.key) {
      case "ArrowDown":
        e.preventDefault();
        sugIndexValue = (sugIndexValue+1 < 5) ? sugIndexValue+1 : sugIndexValue;
        setSugIndex(sugIndexValue);
      break;
      case "ArrowUp":
        e.preventDefault();
        sugIndexValue = (sugIndexValue-1 >= 0) ? sugIndexValue-1 : sugIndexValue;
        setSugIndex(sugIndexValue);
      break;
    }
  }

  return (
    <form onSubmit={onSubmit} id="search-form">
    <button type="submit" onClick={() => setShowSearch(true)}><i className="bi bi-search"></i></button>
    <div className={"search-bar-container" + (showSearch ? " show" : "")} ref={wrapperRef}>
    <input type="text" placeholder="Search..." value={searchQuery} onChange={onQueryChange} onKeyDown={onKeyPressed}
    onFocus={ () => { if(searchQuery !== "") { setShowSuggetions(true); } } } ref={inputRef} />
    { showSuggestions && <div className="suggestions" onClick={ () => { setShowSuggetions(false); } }>
            { loading && <div id="sug-loading"></div> }
            {data.map((row, index) => (<VideoSuggestion key={row.id} video={row} isActive={(index === sugIndex)} />))}
            <div className={"suggestions-showmore" + ((sugIndex === 4) ? " active" : "")} onClick={onSubmit}>Show All Results</div>
             </div>
    }
    <div className='search-close' onClick={() => { setSearchQuery(""); setShowSearch(false); } }><i className="bi bi-x"></i></div>
    </div>
    </form>
  );
}

function user(username, picturePath) {
  return (<><img src={"" + window.SERVER + "/user_thumbnails/" + (picturePath ? picturePath : "default.png")} className="user-profile-pic" alt="profile" /><span>{username}</span></>);
}

function loadingUser() {
  return (<div className="module" id="nav-module"></div>);
}

const NotiTemplate = [
  "commented on #",
  "subscribed to your channel",
  "uploaded video: #",
  "liked #",
  "mentioned you in #"
]

const Notification = ({row, setShowNotifications, setNewNotifications}) => {
  useEffect(() => {
    if(!row.viewed) {
      setNewNotifications(true);
    }
  }, []);

  return (
    <Link to={window.PATH + ((row.videoId) ? "/watch/"+row.videoId : "/channel/"+row.from)} onClick={() => { row.viewed = true; setShowNotifications(false); }}>
    <div className="notification" title={row.title}>
        <img src={"" + window.SERVER + "/user_thumbnails/" + (row.picturePath ? row.picturePath : "default.png")} className="user-profile-pic" alt="profile" />
        <div className="noti">
           <div className="noti-content"><b>{row.fromUsername}</b> {NotiTemplate[(row.type-1)].replace("#",row.title)}</div>
           <div className="noti-date"><ReactTimeAgo date={Date.parse(row.date)} locale="en-US"/> {!row.viewed ? (<span className="dot">&#9679;</span>) : ""}</div>
        </div>
    </div>
    </Link>
  )
}

const NotificationsList = ({data, setShowNotifications,setNewNotifications}) => {
  return (
    <>
    {data.map(noti => <Notification row={noti} key={"noti"+noti.id} 
    setShowNotifications={setShowNotifications} setNewNotifications={setNewNotifications} />)}
    </>
  );
}

const NotificationBell = ({openNotifications, bellRef, newNotifications, setNewNotifications}) => {
  const openNoti = () => {
    if(newNotifications) {
      notificationsView();
    }
    setNewNotifications(false);
    openNotifications();
  }

  return (
    <div className="notification-bell" onClick={openNoti} ref={bellRef}>
    {(newNotifications && <span className="dot">&#9679;</span>)}
    <i className="bi bi-bell"></i>
    </div>
  )
}

const Notifications = React.memo(() => {
  const [showNotifications, setShowNotifications] = useState(false);
  const loadButton = useRef(null);
  const titleRef = useRef(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [newNotifications, setNewNotifications] = useState(false);

  const loadMore = () => {
    if(page < Math.ceil(count/5)) {
      setPage((page) => page + 1);
    }
  }

  useEffect(() => {
    if(!loading && page == Math.ceil(count/5) && loadButton.current) {
        loadButton.current.classList.add('hide');
    }
  }, [loading]);

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      const d = await fetchNotifications(page);
      if (!d.pass) {
        setLoading(false);
      }else{
        setCount(d.count);
        setData((data) => [...data, ...d.data]);
        setLoading(false);
      }
    }
    loadNotifications();
  }, [page]);
  
  const openNotifications = () => {
    titleRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowNotifications(!showNotifications);
  }
  
  const wrapperRef = useRef(null);
  const bellRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target) &&
          !bellRef.current.contains(event.target)) {
            titleRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const onScroll = () => {
    if (wrapperRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = wrapperRef.current;
      if (scrollTop + clientHeight === scrollHeight) {
        if(page < Math.ceil(count/5)) {
            setPage(page => page + 1);
        }
      }
    }
  }

  useEffect(()=>{
    window.socket.on('NOTI', (newData) => {
      setData((data) => [...newData, ...data]);
      setNewNotifications(true);
    });
  },[]);

  return (<>
    <NotificationBell openNotifications={openNotifications} bellRef={bellRef}
     newNotifications={newNotifications} setNewNotifications={setNewNotifications} />
    <div className={"notification-bar" + ((!showNotifications) ? " hide" : "")} ref={wrapperRef} onScroll={() => onScroll()}>
      <span ref={titleRef}></span>
      <h2>Notifications</h2>
      <NotificationsList setShowNotifications={setShowNotifications} data={data} setNewNotifications={setNewNotifications} />
      {loading && <PCNotifications />}
      {!loading && (count > 0) && <button className="loadmore" onClick={loadMore} ref={loadButton}>Load more videos...</button>}
      {!loading && (count == 0) && <div id="noti-empty">No new notifications</div>}
    </div>
    </>
  )
});

const Member = ({onLogout, isUserSignedIn, setOpenLogin, refreshBar}) => {
  const [navTitle, setNavTitle] = useState(loadingUser());
  const [channelId, setChannelId] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    async function getDetails() {
          const d = await mydetails();
          if(d.pass) {
            setNavTitle(user(d.data[0].username, d.data[0].picturePath));
            setChannelId(d.data[0].id);
            if(localStorage.getItem('myid') === null)
               localStorage.setItem("myid", d.data[0].id);
          }else{
            console.log(d);
            //!d.error.contains("NetworkError") || 
            if(d.msg === "AUTH_FAIL") 
                onLogout();
            if(d.error) {
              if(!d.error.includes("NetworkError")) 
              onLogout();
            }
          }
    }
    if(isUserSignedIn) {
      getDetails();
    }
}, [refreshBar]); 

  const showLogin = () => { setOpenLogin(true); };
  const openMenu = () => {
    setShowMenu(!showMenu);
  }

  const userRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (userRef.current && !userRef.current.contains(event.target)) {
          setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userRef]);

  return (
    <div id="member">
    {
        (isUserSignedIn && <> 
        <Notifications />
        <div style={{position:"relative"}} ref={userRef}>
        <div className="user" onClick={openMenu}>{navTitle} <i className="bi bi-caret-down-fill"></i></div>
        {showMenu && 
        <ul className='user-menu'>
          <Link to={window.PATH + "/upload"} onClick={ () => { setShowMenu(false); } }><li><i className="bi bi-upload"></i> Upload Video</li></Link>
          <Link to={window.PATH + "/channel/" + channelId} onClick={ () => { setShowMenu(false); } }><li><i className="bi bi-tv"></i> My Channel</li></Link>
          <Link to={window.PATH + "/settings"} onClick={ () => { setShowMenu(false); } }><li><i className="bi bi-gear"></i> Settings</li></Link>
          <Link to={window.PATH + "/#logout"} onClick={(e) => { e.preventDefault(); setShowMenu(false); onLogout(); }}><li><i className="bi bi-box-arrow-right"></i> Logout</li></Link>
        </ul> }
        </div>
        </>)
    }
    {
        (!isUserSignedIn && <><a id="login-button" onClick={showLogin}><i className="bi bi-people"></i>Sign in</a></>)
    }
</div>
  );
}
         

function Searchbar(props) {
    const {onLogout, isUserSignedIn, setIsUserSignedIn, refreshBar} = props;
    const [openLogin, setOpenLogin]  = useState(false);

    const closeLogin = () => { setOpenLogin(false); };
  
    const onLoginSuccessful = () => {
      setIsUserSignedIn(true);
      setOpenLogin(false);
      window.location.href = "";
    };

    return (<>
        {(openLogin && <Login closeLogin={closeLogin} onLoginSuccessful={onLoginSuccessful} />)}
        <div id="search-bar">
          <Search />
          <Member refreshBar={refreshBar} onLogout={onLogout} isUserSignedIn={isUserSignedIn} setOpenLogin={setOpenLogin} />
        </div>
        </>
    );
}

export default Searchbar;
