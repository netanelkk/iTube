import React, { useEffect, useState, useRef } from 'react'
import { fetchLikes } from "../../api";
import { VideoSuggestion } from "../video/videoBox"
import { PCResultRow } from "../placeholderComponents/homepage"

const ResultList = ({data}) => {
  return (
    <>
    {data.map((video) => (<VideoSuggestion key={video.id} video={video} isLiked={true} />))}
    </>
  );
}

const LikedResult = ({isUserSignedIn}) => {
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
      setLoading(true);
      const d = await fetchLikes(page);
      if (!d.pass) {
        setLoading(false);
      }else{
        setCount(d.count);
        setData((data) => [...data, ...d.data]);
        setLoading(false);
      }
    }
    loadVideos();
  }, [page]);
      
  return (
    <>
    <h1>Liked Videos</h1>
    <div className="row">
    <ResultList data={data} />
    </div>
    {loading && <PCResultRow />}
    {!loading && (count > 0) && <button className="loadmore loadmorevideo" onClick={loadMore} ref={loadButton}>Load more videos...</button>}
    {!loading && (count == 0) && isUserSignedIn && <div className="access-error">You haven't liked any videos yet</div>}
    {!loading && (count == 0) && !isUserSignedIn && <div className="access-error"><i className="bi bi-exclamation-circle"></i> Sign in to get access to liked videos</div>}
    </>
  );
}

function Liked({isUserSignedIn, setTitle, topRef}) {
  setTitle("Liked Videos");

  useEffect(() => {
    topRef.current.scrollTop = 0;
  },[]);

  return (
    <LikedResult key={Math.random()} isUserSignedIn={isUserSignedIn} />
  )
}

export default Liked;
