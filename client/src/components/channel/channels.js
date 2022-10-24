import React, { useState, useRef, useEffect } from 'react'
import { channelSubscriptions } from "../../api";
import { PCChannels } from "../placeholderComponents/channel"
import { Link  } from "react-router-dom";

const ChannelBox = ({channel}) => {
  return (<Link className="channelbox col-lg-3 col-md-4 col-sm-6" to={window.PATH+"/channel/"+channel.id }><div>
  <img src={"" + window.SERVER + "/user_thumbnails/" + (channel.picturePath ? channel.picturePath : "default.png") } alt="profile"/>
  <div className='channelbox-user'>{channel.username}</div>
  <div className='channelbox-sub'>{channel.subscribers} subscribers</div>
  </div></Link>)
}

const ChannelsMap = ({data}) => {
    return (
      <div className="row">
      {data.map(channel => (<ChannelBox channel={channel} key={"chnlbox"+channel.id}></ChannelBox>))}
      </div>
    );
}
  
const Channels = ({userId}) => {
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
        const d = await channelSubscriptions(userId,page);
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
      <h1 id="channel-title">{count} Channels</h1>
      <ChannelsMap data={data} />
      {loading && <div className='row'><PCChannels /><PCChannels /></div>}
      {!loading && (count > 0) && <button className="loadmore loadmorevideo" onClick={loadMore} ref={loadButton}>Load more channels...</button>}
      {!loading && (count == 0) && <div className="access-error">There are no channels yet</div>}
      
      </div>
    );
};
  


export default Channels;