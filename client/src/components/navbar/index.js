import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from "react-router-dom";
import { mysubscriptions } from '../../api';
import { PCSubscription } from "../placeholderComponents/homepage"

//React.memo(
const Subscriptions = ({isUserSignedIn,refreshSubs, bottom}) => {
    const loadButton = useRef(null);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
  
    const loadMore = () => {
      if(page < Math.ceil(count/12)) {
        setPage((page) => page + 1);
      }
    }
  
    useEffect(() => {
      if(!loading && page == Math.ceil(count/12)) {
          loadButton.current.classList.add('hide');
      }
    }, [loading]);

    useEffect(() => {
        if(page < Math.ceil(count/12)) {
            setPage((page) => page + 1);
        }
    }, [bottom]);
  
    useEffect(() => {
      const loadVideos = async () => {
        if(page == 1) {
          setData([]);
        }
        setLoading(true);
        const d = await mysubscriptions(page);
        if (!d.pass) {
          setLoading(false);
        }else{
          setCount(d.data[0].count);
          setData((data) => [...data, ...d.data]);
          setLoading(false);
        }
      }
      loadVideos();
    }, [page]);

    return (
    <>
    {(isUserSignedIn && <><h2>SUBSCRIPTIONS</h2>
        <ul className="menu-list menu-sub">
        {data.map(channel => (<Link to={window.PATH + "/channel/" + channel.id} key={"mychannel"+channel.id}><li>
            <img src={"" + window.SERVER + "/user_thumbnails/" + (channel.picturePath ? channel.picturePath : "default.png")} alt="profile-pic" />
            <span>{channel.username}</span>
            </li></Link>))}
        </ul>
    {loading && <PCSubscription />}
    {!loading && (count > 0) && <button className="loadmore loadmorevideo" onClick={loadMore} ref={loadButton}>Load more channels...</button>}
    {!loading && (count == 0) && <span className="sub-error"></span>}
    </>)} 
    </>
    );
};



function Navbar({refreshSubs, isUserSignedIn}) {
    const location = useLocation();
    const path = window.location.pathname.replace(window.PATH,'').split("/")[1];
    const [pathChange, setPathChange] = useState(0);
    const listInnerRef = useRef();
    const updateActive = () => { 
      if(openNav!==null) { 
        setOpenNav(false); 
      } 
      setPathChange(pathChange+1); 
    }
    const [bottom, setBottom] = useState(false);
    const [openNav, setOpenNav] = useState(null);

    React.useEffect(() => {
        updateActive();
    }, [location]);

    const onScroll = () => {
        if (listInnerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = listInnerRef.current;
          if (scrollTop + clientHeight === scrollHeight) {
            setBottom(true);
          }else{
            setBottom(false);
          }
        }
    };

    const navToggle = () => {
      if(openNav===null) {
        setOpenNav(true);
      }else{
        setOpenNav(!openNav);
      }
    }


    return (
      <>
      <div id="alt-nav">
      {openNav && <div id="modal-bg" onClick={navToggle}></div> }
      <div id="open-nav" onClick={navToggle}><i className="bi bi-list"></i></div>
      <Link to={window.PATH} onClick={updateActive}><i className="bi bi-play-btn" id="nav-logo"></i></Link>
      </div>
      <div className={((openNav===true) ? "open" : "") + ((openNav===false) ? "close" : "")} id="navbar" onScroll={() => onScroll()} ref={listInnerRef}>
        <div id="nav-con">
        <Link to={window.PATH + "/"} onClick={updateActive}><div id="logo"><i className="bi bi-play-btn"></i><span id="i"></span></div></Link>
        <div id="menu">
        <ul className="menu-list">
        <Link to={window.PATH + "/"} onClick={updateActive}><li className={(path==="") ? "active" : ""}><i className="bi bi-house-fill"></i>Home</li></Link>
        <Link to={window.PATH + "/trending"} onClick={updateActive}><li className={(path==="trending") ? "active" : ""}><i className="bi bi-fire"></i>Trending</li></Link>
        </ul>


            <h2>LIBRARY</h2>
        <ul className="menu-list">
        <Link to={window.PATH + "/subscriptions"} onClick={updateActive}><li className={(path==="subscriptions") ? "active" : ""}><i className="bi bi-bookmark-fill"></i>Subscriptions</li></Link>
        <Link to={window.PATH + "/history"} onClick={updateActive}><li className={(path==="history") ? "active" : ""}><i className="bi bi-clock-fill"></i>History</li></Link>
        <Link to={window.PATH + "/likes"} onClick={updateActive}><li className={(path==="likes") ? "active" : ""}><i className="bi bi-heart-fill"></i>Likes</li></Link>
        </ul>

            <Subscriptions key={"refresh"+refreshSubs} isUserSignedIn={isUserSignedIn} bottom={bottom} />
        </div>
    </div>
            <div id="menu-footer">&copy; iTube 2022 &#183; <a href="http://netanel.website" target="_blank">netanel.website</a></div>

    </div>
    </>
  );
}

export default Navbar;
