import React, { useEffect, useState, useRef } from 'react'
import { fetchHistory } from "../../api";
import { VideoSuggestion } from "../video/videoBox"
import { PCResultRow } from "../placeholderComponents/homepage"

const ResultList = ({data}) => {
  return (
    <>
    {data.map((video) => (<VideoSuggestion key={video.id} video={video} isHistory={true} />))}
    </>
  );
}

const HistoryResult = ({isUserSignedIn}) => {
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
      const d = await fetchHistory(page);
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
    <h1>Watch History</h1>
    <div className="row">
    <ResultList data={data} />
    </div>
    {loading && <PCResultRow />}
    {!loading && (count > 0) && <button className="loadmore loadmorevideo" onClick={loadMore} ref={loadButton}>Load more videos...</button>}
    {!loading && (count == 0) && isUserSignedIn && <div className="access-error">You haven't watched any videos yet</div>}
    {!loading && (count == 0) && !isUserSignedIn && <div className="access-error"><i className="bi bi-exclamation-circle"></i> Sign in to get access to history</div>}
    </>
  );
}
function History({isUserSignedIn, setTitle, topRef}) {
  setTitle("Watch History");

  useEffect(() => {
    topRef.current.scrollTop = 0;
  },[]);

  return (
    <HistoryResult key={Math.random()} isUserSignedIn={isUserSignedIn} />
  )
}

export default History;
