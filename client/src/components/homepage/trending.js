import React, {useRef, useEffect} from 'react'
import Async  from "react-async";
import { fetchTrending } from "../../api";
import VideoBox from "../video/videoBox";
import { PCVideoTrending } from "../placeholderComponents/homepage"

function Trending({setTitle, topRef}) {
  setTitle("Trending");

    const getData = async () => {
        const d = await fetchTrending();
        if (!d.pass) throw new Error("error");
        return d.data;
    }
      
    useEffect(() => {
      topRef.current.scrollTop = 0;
    },[]);
    
  return (
    <>
    <h1>Trending</h1>
    <Async promiseFn={getData}>
    {({ data, error, isPending }) => {
      if (isPending) return (<PCVideoTrending />);
      if (error) return (<div className="access-error">No videos were found</div>);
      if (data)
        return ( 
          <div className="row">
            {data.map((video, index) => (<VideoBox video={video} col="4" index={index} key={"newest"+video.id} />))}
            </div>
        )
      return null
    }}
    </Async>
    </>
  );
}

export default Trending;
