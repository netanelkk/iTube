import React, {useEffect} from 'react'
import Async  from "react-async";
import { fetchSubscriptions } from "../../api";
import VideoBox from "../video/videoBox";
import { PCVideoRow } from "../placeholderComponents/homepage"

function Subscriptions({isUserSignedIn, setTitle, topRef}) {
  setTitle("Subscriptions");
    const getData = async () => {
        const d = await fetchSubscriptions();
        if (!d.pass) throw new Error();
        return d.data;
    }
  
    useEffect(() => {
      topRef.current.scrollTop = 0;
    },[]);
      
  return (
    <>
    <h1>Subscriptions</h1>
    <Async promiseFn={getData}>
    {({ data, error, isPending }) => {
      if (isPending) return (<><PCVideoRow /><PCVideoRow /><PCVideoRow /></>)
      if (error) {
        if(isUserSignedIn) {
          return (<div className="access-error">Your subscription list is empty</div>);
        }else{
          return (<div className="access-error"><i className="bi bi-exclamation-circle"></i> Sign in to get access to subscriptions list</div>);
        }
      }
      if (data)
        return ( 
          <div className="row">
            {data.map((video) => (<VideoBox video={video} col="4" key={"sub"+video.id} />))}
            </div>
        )
      return null
    }}
    </Async>

    </>
  );
}

export default Subscriptions;
