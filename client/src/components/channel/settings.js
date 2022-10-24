import React, { useState, useEffect } from 'react'
import ErrorLogin from "../errors/errorLogin";
import Error404 from "../errors/error404";
import Alert from "../errors/alert";
import { PCFormLabel, PCFormPicture, PCFormCheck } from "../placeholderComponents/homepage"
import Async  from "react-async";
import { mydetails, updatedetails, mysettings, updatesettings, updateprofile } from "../../api";
import { Link, useLocation } from "react-router-dom";

const AlertMessage = ({alertMessage,setAlertMessage, success}) => {
    const closeError = () => setAlertMessage("");
    return (<>
        { (alertMessage !== '') && <Alert message={alertMessage} close={closeError} success={success} /> }
    </>);
}

function applyText() {
    return (<><span>Apply</span></>);
}

function loadingText() {
    return (<><div className="loading"></div><span>Loading..</span></>);
}

const SettingsForm = ({data, setRefreshBar}) => {
    const [buttonText, setbuttonText] = useState(applyText);
    const [disabled, setDisabled] = useState("");
    const [email, setEmail] = useState(data.email);
    const [newPassword, setNewPassword] = useState("");
    const [password, setPassword] = useState("");
    const [success, setSuccess] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const onPasswordChange = (event) => setPassword(event.target.value);
    const onNewPasswordChange = (event) => setNewPassword(event.target.value);
    const onEmailChange = (event) => setEmail(event.target.value);

    function loading(show=true) {
        if(show) {
            setDisabled("disabled");
            setbuttonText(loadingText());
        }else{
            setDisabled("");
            setbuttonText(applyText());
        }
    }

    const submit = async (e) => {
        e.preventDefault();
        loading();
        const updateResult = await updatedetails({ email, newPassword, password }); 
        if(updateResult.pass) {
            setAlertMessage("Settings updated successfully");
            setSuccess(true);
            setNewPassword("");
            setPassword("");
           setTimeout(() => {
            setRefreshBar(x => x+1);
           },2000);
        }else{
            setSuccess(false);
            setAlertMessage(updateResult.msg);
        }        

        loading(false);
    }


    return (
        <>
        {alertMessage && <AlertMessage alertMessage={alertMessage} setAlertMessage={setAlertMessage} success={success} />}
        <form className='upload-form' onSubmit={submit}>
        <h3 className="subtitle">Username</h3>
        <input type="text" className="input" value={data.username} disabled />
        <h3 className="subtitle">Email</h3>
        <input type="text" className="input" value={email} onChange={onEmailChange} />
        <h3 className="subtitle">New Password</h3>
        <input type="password" className="input" placeholder="Leave empty to keep the same"
        value={newPassword} onChange={onNewPasswordChange} />
        <h3 className="subtitle" style={{marginTop:"50px"}}>Current Password</h3>
        <input type="password" className="input" value={password} onChange={onPasswordChange} />
        <button className="submit" disabled={disabled}>{buttonText}</button>
        </form>
        </>
    );
}

const Profile = ({data}) => {
    const [buttonText, setbuttonText] = useState(applyText);
    const [disabled, setDisabled] = useState("");
    const [success, setSuccess] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [about, setAbout] = useState(data.about);
    const onAboutChange = (event) => setAbout(event.target.value);

    function loading(show=true) {
        if(show) {
            setDisabled("disabled");
            setbuttonText(loadingText());
        }else{
            setDisabled("");
            setbuttonText(applyText());
        }
    }

    const submit = async (e) => {
        e.preventDefault();
        loading();
        const updateResult = await updateprofile(about); 
        if(updateResult.pass) {
            setSuccess(true);
            setAlertMessage("Settings updated successfully");
        }else{
            setSuccess(false);
            setAlertMessage("Try again later");
        }        
        loading(false);
    }

    return (
        <>
        {alertMessage && <AlertMessage alertMessage={alertMessage} setAlertMessage={setAlertMessage} success={success} />}
        <form className='upload-form' onSubmit={submit}>
        <h3 className="subtitle">Picture</h3>
        <div>
        <img src={"" + window.SERVER + "/user_thumbnails/" + (data.picturePath ? data.picturePath : "default.png") } alt="profile" className="profile-pic"/>
        </div>
        <p className='ref-button'><Link to={window.PATH + "/channel/"+localStorage.getItem('myid')}>Change from channel page</Link></p>
        <br />
        <h3 className="subtitle">About</h3>
        <textarea className="input" placeholder='Write here about you..'
        maxLength="255" onChange={onAboutChange} value={about}></textarea>
        <button className="submit" disabled={disabled}>{buttonText}</button>
        </form>
        </>
    )
}

var notiSettings = {};
const Notifications = ({data}) => {
    const [buttonText, setbuttonText] = useState(applyText);
    const [disabled, setDisabled] = useState("");
    const [success, setSuccess] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    function loading(show=true) {
        if(show) {
            setDisabled("disabled");
            setbuttonText(loadingText());
        }else{
            setDisabled("");
            setbuttonText(applyText());
        }
    }

    const submit = async (e) => {
        e.preventDefault();
        loading();
        const updateResult = await updatesettings(notiSettings); 
        if(updateResult.pass) {
            setSuccess(true);
            setAlertMessage("Settings updated successfully");
        }else{
            setSuccess(false);
            setAlertMessage("Try again later");
        }        
        loading(false);
    }

    const optionChange = (notiId) => {
        var keys = Object.keys(notiSettings);
        notiSettings[keys[notiId-1]] = (notiSettings[keys[notiId-1]]===1) ? 0 : 1;
    }

    return (
        <>
        {alertMessage && <AlertMessage alertMessage={alertMessage} setAlertMessage={setAlertMessage} success={success} />}
                <form className='upload-form' onSubmit={submit}>
                <h3 className="subtitle">Notifications</h3>
                <label className='custom-option noti-option' htmlFor="noti1">
                        <input type="checkbox" id="noti1" onChange={() => optionChange(1)} defaultChecked={data.newcomment===1} />
                        <span className="checkmark"></span>
                        <span>New comments on your videos</span>
                </label>
                <label className='custom-option noti-option' htmlFor="noti2">
                        <input type="checkbox" id="noti2" onChange={() => optionChange(2)} defaultChecked={data.newsub===1} />
                        <span className="checkmark"></span>
                        <span>New subscribers</span>
                </label>
                <label className='custom-option noti-option' htmlFor="noti3">
                        <input type="checkbox" id="noti3" onChange={() => optionChange(3)} defaultChecked={data.newvid===1} />
                        <span className="checkmark"></span>
                        <span>New content from subscribed channels</span>
                </label>
                <label className='custom-option noti-option' htmlFor="noti4">
                        <input type="checkbox" id="noti4" onChange={() => optionChange(4)} defaultChecked={data.like===1} />
                        <span className="checkmark"></span>
                        <span>Likes on your video</span>
                </label>
                <label className='custom-option noti-option' htmlFor="noti5">
                        <input type="checkbox" id="noti5" onChange={() => optionChange(5)} defaultChecked={data.mention===1} />
                        <span className="checkmark"></span>
                        <span>Mentions in comments</span>
                </label>
                <button className="submit" disabled={disabled}>{buttonText}</button>
                </form>

        </>
    )
}

const Tabs = ({pageId, setPageId, path, location}) => {
    useEffect(() => {
        let page = 1;
        if(path) {
          switch(path) {
            case "profile":
              page = 2;
              break;
            case "notifications":
              page = 3;
              break;
          }
        }
        setPageId(page);
      }, [location]);

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
    <li className='tab-li'><Link to=""><div className='tab-item'>Account</div><div className='tab-underline'></div></Link></li>
    <li className='tab-li'><Link to="profile"><div className='tab-item'>Profile</div><div className='tab-underline'></div></Link></li>
    <li className='tab-li'><Link to="notifications"><div className='tab-item'>Notifications</div><div className='tab-underline'></div></Link></li>
    </ul>
    );
}

function Settings({isUserSignedIn, setRefreshBar, setTitle, topRef}) {
    setTitle("Settings");
    const location = useLocation();
    const [pageId, setPageId] = useState(1);
    const path =  window.location.pathname.replace(window.PATH,'').split("/")[2];

    const getData = async () => {
        const d = await mydetails();
        if (!d.pass) throw new Error("error");
        return d.data[0];
    }

    const getNotiData = async () => {
        const d = await mysettings();
        if (!d.pass) throw new Error("error");
        if(d.data === 0) {
            notiSettings = { newcomment:1, newsub:1, newvid:1, like:1, mention:1 };
            return notiSettings;
        }
        notiSettings = d.data[0];
        return notiSettings;
    }

    useEffect(() => {
        topRef.current.scrollTop = 0;
      },[pageId]);

  return (
    <>
        { !isUserSignedIn && <ErrorLogin /> }
        { isUserSignedIn && <>
        <h1>Settings</h1>
        <Tabs pageId={pageId} setPageId={setPageId} path={path} key={"tab"+pageId} location={location} />
        {pageId === 1 && 
                <Async promiseFn={getData}>
                {({ data, error, isPending }) => {
                  if (isPending) return (<><PCFormLabel /><PCFormLabel /><PCFormLabel /><br /><PCFormLabel /></>)
                  if (error) { return (<Error404 />); }
                  if (data)
                    return ( 
                        <SettingsForm data={data} setRefreshBar={setRefreshBar} />
                    )
                }}
                </Async>
        }
        {pageId === 2 &&         
                <Async promiseFn={getData}>
                {({ data, error, isPending }) => {
                    if (isPending) return (<><div className="row">
                        <div>
                        <PCFormPicture />
                        </div>
                        <div style={{marginTop: "50px"}}>
                        <PCFormLabel />
                        </div>
                        </div></>)
                    if (error) { return (<Error404 />); }
                    if (data)
                    return (
                        <Profile data={data} />
                    )
                }}
                </Async>
        }
        {pageId === 3 && 
                <Async promiseFn={getNotiData}>
                {({ data, error, isPending }) => {
                    if (isPending) return (<><PCFormCheck /><PCFormCheck /><PCFormCheck /><PCFormCheck /><PCFormCheck /></>)
                    if (error) { return (<Error404 />); }
                    if (data)
                    return (
                        <Notifications data={data} />
                    )
                    }}
                </Async>
        }
        </>
        }
    </>
  );
}


export default Settings;
