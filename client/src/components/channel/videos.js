import React, { useState, useRef, useEffect } from 'react'
import VideoBox from "../video/videoBox";
import { uploadedVideos, channelLiked } from "../../api";
import { PCChannel } from "../placeholderComponents/channel"

const UploadedVideos = ({data, setCount, userId,hidePublisher}) => {
    return (
      <div className="row">
      {data.map(video => (<VideoBox video={video} col="3" key={"channel"+video.id}
                                    hidePublisher={hidePublisher} setCount={setCount} userId={userId} />))}
      </div>
    );
  }
  
const Videos = ({userId, tabpage}) => {
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
      const loadVideos = async () => {
        if(page == 1) {
          setData([]);
        }
        setLoading(true);
        const d = (tabpage === 1) ? await uploadedVideos(userId, page) : await channelLiked(userId,page);
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
      <div className="channel">
      <h1 id="channel-title">{count} {tabpage === 1 ? "Uploaded Videos" : "Liked Videos"}</h1>
      <UploadedVideos data={data} setCount={setCount} userId={userId} hidePublisher={(tabpage===1)} />
      {loading && <><PCChannel /><PCChannel /></>}
      {!loading && (count > 0) && <button className="loadmore loadmorevideo" onClick={loadMore} ref={loadButton}>Load more videos...</button>}
      {!loading && (count == 0) && <div className="access-error">There are no videos yet</div>}
      
      </div>
    );
};
  


export default Videos;