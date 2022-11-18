import React, { useState, useRef } from 'react'
import Homepage from './components/homepage';
import Navbar from "./components/navbar";
import Watch from "./components/video/watch"
import Searchbar from "./components/navbar/search";
import Search from "./components/search"
import Trending from "./components/homepage/trending"
import Channel from "./components/channel"
import Subscriptions from "./components/library/subscriptions"
import History from "./components/library/history"
import Likes from "./components/library/likes"
import Error404 from "./components/errors/error404";
import Upload from "./components/video/upload"
import Settings from "./components/channel/settings";
import {io} from 'socket.io-client'

// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.min.css";
// Bootstrap Bundle JS
import "bootstrap/dist/js/bootstrap.bundle.min";
import './App.css';

import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en.json'
import { BrowserRouter, Routes, Route } from "react-router-dom";

TimeAgo.addDefaultLocale(en);


const local = false;
if(local) {
  window.PATH = "";
  window.API_URL = "http://10.0.0.165:4000";
}else{
  window.PATH = "/sources/itube";
  window.API_URL = "https://45.136.70.128:4000";
}


window.SERVER = window.API_URL + "/public";
if(localStorage.getItem('token') != null)
  window.socket = io(window.API_URL, { auth: { token: localStorage.getItem('token') } }); 

  
const Pages = React.memo((props) => {
  const {isUserSignedIn, setRefreshSubs, setRefreshBar} = props;
  const topRef = useRef();

  const setTitle = (title) => {
    document.title = "iTube"+((title=="") ? "" : " - "+title);
  };

  return (<div id="main-content" ref={topRef}>
    <Routes>
      <Route path={window.PATH+"/"} element={<Homepage setTitle={setTitle} topRef={topRef} />} />
      <Route path={window.PATH+"/trending"} element={<Trending setTitle={setTitle} topRef={topRef} />}  />
      <Route path={window.PATH+"/watch"} element={<Watch isUserSignedIn={isUserSignedIn}  setTitle={setTitle} topRef={topRef} />}>
         <Route path=":id" />
      </Route>
      <Route path={window.PATH+"/search"} element={<Search setTitle={setTitle} topRef={topRef} />}>
         <Route path=":query" />
      </Route>
      <Route path={window.PATH+"/channel"} element={<Channel setTitle={setTitle} isUserSignedIn={isUserSignedIn} setRefreshSubs={setRefreshSubs} setRefreshBar={setRefreshBar} topRef={topRef} />}>
         <Route path=":id">
            <Route path="liked" />
            <Route path="channels" />
            <Route path="about" />
         </Route>
      </Route>
      <Route path={window.PATH+"/subscriptions"} element={<Subscriptions setTitle={setTitle} isUserSignedIn={isUserSignedIn} topRef={topRef} />} />
      <Route path={window.PATH+"/history"} element={<History setTitle={setTitle} isUserSignedIn={isUserSignedIn} topRef={topRef} />} />
      <Route path={window.PATH+"/likes"} element={<Likes setTitle={setTitle} isUserSignedIn={isUserSignedIn} topRef={topRef} />}  />
      <Route path={window.PATH+"/upload"} element={<Upload setTitle={setTitle} isUserSignedIn={isUserSignedIn} topRef={topRef} />}  />
      <Route path={window.PATH+"/settings"} element={<Settings setTitle={setTitle} isUserSignedIn={isUserSignedIn} setRefreshBar={setRefreshBar} topRef={topRef} />} >
            <Route path="profile" />
            <Route path="notifications" />
      </Route>
      <Route path="*" element={<Error404 />} />
    </Routes>
        </div>
  );
});

function App() {
  const [isUserSignedIn, setIsUserSignedIn] = useState(localStorage.getItem('token') != null);  
  const [refreshSubs, setRefreshSubs] = useState(0);  
  const [refreshBar, setRefreshBar] = useState(0);  

  const onLogout = () => {
    localStorage.removeItem("token"); 
    localStorage.removeItem("myid"); 
    setIsUserSignedIn(false);
    window.location.href = "";
  };

  return (
    <div>
      <BrowserRouter>
      <Navbar refreshSubs={refreshSubs} isUserSignedIn={isUserSignedIn} />
        <div id="main-page">
          <Searchbar refreshBar={refreshBar} isUserSignedIn={isUserSignedIn}
           setIsUserSignedIn={setIsUserSignedIn} onLogout={onLogout} />
          <Pages isUserSignedIn={isUserSignedIn} setRefreshSubs={setRefreshSubs} setRefreshBar={setRefreshBar} />
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
