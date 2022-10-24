import React, { useState, useRef, useEffect } from 'react'
import { useParams } from "react-router-dom";
import Async  from "react-async";
import { watch, like, fetchComments, fetchAlsoLike, addComment, deletecomment, userSearch } from "../../api";
import Error404 from "../errors/error404";
import { Player } from 'video-react';
import ReactTimeAgo from 'react-time-ago'
import VideoBox from "../video/videoBox";
import { AddLinks } from 'react-link-text';
import { Link } from "react-router-dom";
import { PCVideoWatch } from "../placeholderComponents/video";
import ContentEditable from 'react-contenteditable'
import reactStringReplace from 'react-string-replace';
import { PCChannel } from "../placeholderComponents/channel"

function ToggleButton() {
    const [descToggle, setDescToggle] = useState("Show More");
    const toggleDescription = (e) => { 
         setDescToggle((descToggle=="Show More") ? "Show Less" : "Show More");
         e.target.parentElement.classList.toggle('open');
     };

    return (
    <button className="a" onClick={toggleDescription}>{descToggle}</button>
    );
}

const LikeButton = (props) => {
  const { videoId, didLike, isUserSignedIn } = props;
  const [liked, setLiked] = useState(didLike);
  const [likes, setLikes] = useState(props.likes);

  const likeUnlikeClick = async () => {
    if(isUserSignedIn) {
      if(!liked) {
        setLiked(true);
        const d = await like(videoId);
        if (!d.pass) {
          setLiked(false);
          throw new Error("error");
        }
        setLikes(likes => likes+1);
        window.socket.emit('NEWNOTI', d.notiId);
      }else{
        setLiked(false);
        const d = await like(videoId);
        if (!d.pass) {
          setLiked(true);
          throw new Error("error");
        }
        setLikes(likes => likes-1);
      }
    }
  }

  return (
    <div className={"like" + (isUserSignedIn && liked ? " liked" : "") + (!isUserSignedIn ? " disabled" : "")}
         onClick={likeUnlikeClick}>
      {(isUserSignedIn && liked ? <i className="bi bi-heart-fill"></i> : <i className="bi bi-heart"></i>)}
      <span>Like</span>
      <span id="count-likes">{likes}</span>
    </div>
  );
};


function sendText() {
  return (<><i className="bi bi-send" id="comment-send"></i></>);
}

function loadingText() {
  return (<><div className="loading"></div></>);
}

function commentLoading() {
  return (<><div className="loading" id="comment-loading"></div></>);
}

var tagMode, sugs, cnt, sugIndexValue, comment_count;

function varclear() {
  tagMode = false;
  sugs = [];
  cnt = "";
  sugIndexValue = 0;
  comment_count = 0;
}

const Suggestion = ({user,addTag, isActive}) => {
  const tagClick = (e) => {
    e.preventDefault();
    addTag(user.username);
  };

  return (<li className={(isActive) ? "sug-active" : "sug"} onClick={tagClick}>
    <img src={"" + window.SERVER + "/user_thumbnails/" + (user.picturePath ? user.picturePath : "default.png") } alt="profile"/>
    <span>{user.username}</span>
          </li>
  )
}

const AddComment = ({videoId, updateMyComments, setCommentCount}) => {
  const [content, setContent] = useState("");
  const [submitText, setSubmitText] = useState(sendText);
  const [disabled, setDisabled] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [sugIndex, setSugIndex] = useState(sugIndexValue);
  const [isLoading, setIsLoading] = useState(false);

  function loading(show=true) {
    if(show) {
        setDisabled("disabled");
        setSubmitText(loadingText);
    }else{
        setDisabled("");
        setSubmitText(sendText);
    }
  }

  
  const onSubmit = async (event) => {
    event.preventDefault();
    loading();
    const sendResult = await addComment(videoId, stripHtml(cnt));
    if(sendResult.pass) {
      setContent("");
      sendResult.data[0].content = contentWithTags(sendResult.data[0].content, sendResult.tags);
      updateMyComments(<Comment key={"comment"+sendResult.data[0].id} comment={sendResult.data[0]} setCommentCount={setCommentCount} />);
      sendResult.notiId.forEach(user => {
        window.socket.emit('NEWNOTI', user);
      });
    }      
    loading(false);
  };

  function stripHtml(html) {
   let tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
  }
  

  const contentEditable = useRef();

  async function handleChange(e) {
    let value = e.target.value.replace("&nbsp;", " ").replace("<br>", "");
    let valueSplit = value.split("@");
    let spaceSplit = value.split(' ') 
      if(value[value.length-1] === "@"|| spaceSplit[spaceSplit.length-1][0] === "@") tagMode = true;
      if(value[value.length-1] === " " || value.length == 0) tagMode = false;
      cnt = e.target.value.replace("&nbsp;", " ");
      setContent(cnt); 
      if(tagMode) {
        let content = valueSplit[valueSplit.length-1];
        const index = (content.indexOf(' ') === -1) ? content.length : content.indexOf(' ');
        if(index > 0) {
          setIsLoading(true);
          const d = await userSearch(content.slice(0, index));
          setIsLoading(false);
          if(d.pass && tagMode) { // tagMode checked again because of await delay
            setSuggestions(d.data);
            sugIndexValue = 0;
            setSugIndex(sugIndexValue);
            sugs = d.data;
          }else{
            setSuggestions([]);
            sugs = [];
          }
        }
      }else{
        sugs = [];
        setSuggestions([]);
      }
  }

  const addTag = (username) => {
    let withoutTag = cnt.lastIndexOf("@");
    cnt = cnt.slice(0, withoutTag) + "<div class='tag' contenteditable='false'>@"+username+"</div>&nbsp;";
    setContent(cnt);
    tagMode = false;
    contentEditable.current.focus();
    sugs = [];
    setSuggestions(sugs);
  };

  const onKeyPressed = (e) => {
    switch(e.key) {
      case "ArrowDown":
        e.preventDefault();
        sugIndexValue = (sugIndexValue+1 < sugs.length) ? sugIndexValue+1 : sugIndexValue;
        setSugIndex(sugIndexValue);
      break;
      case "ArrowUp":
        e.preventDefault();
        sugIndexValue = (sugIndexValue-1 >= 0) ? sugIndexValue-1 : sugIndexValue;
        setSugIndex(sugIndexValue);
      break;
      case "Enter":
        e.preventDefault();
        if(sugs.length > 0) {
          addTag(sugs[sugIndexValue].username);
          sugs = [];
          setSuggestions(sugs);
        }else{
          onSubmit(e);
        }
      break;
    }
  }

  const insertTag = (e) => {
    e.preventDefault();
    setContent((content + "@").replace("<br>","")); 
    contentEditable.current.focus();
  }

  return (
    <div className="comment-container">
    <form className="comment-form" onSubmit={onSubmit}>
    <div id="comment-textbox">
    <ContentEditable innerRef={contentEditable}
      html={content} onChange={handleChange} onKeyDown={onKeyPressed} />
    <span onClick={insertTag} title="Tag User">@</span>
    </div>
    <button disabled={disabled}>{submitText}</button>
    </form>
    {suggestions.length > 0 &&
      <ul className="tag-suggestions">
        { isLoading && <li id="tag-loading"></li> }
      {suggestions.map((user,index) => <Suggestion key={"suggest"+user.username} user={user} addTag={addTag} isActive={(index === sugIndex)} />)}
      </ul> }
    </div>
  );
}

function deleteIcon() {
  return (<i className="bi bi-x"></i>);
}

function Comment({comment, setCommentCount}) {
  const commentBox = useRef(null);
  const [deleteText, setDeleteText] = useState(deleteIcon);
  const [disabled, setDisabled] = useState(false);
  const allowDelete = (localStorage.getItem("myid") == comment.userId);

  const loading = (show=true) => {
    if(show) {
      setDisabled(true);
      setDeleteText(loadingText);
    }else{
      setDisabled(false);
      setDeleteText(deleteIcon);
    }
  }

  const deleteClick = async (e) => {
    const target = e.currentTarget;
    if(!disabled) {
      target.classList.add("cursor-default");
      loading();
      const d = await deletecomment(comment.id);
      if (!d.pass) { 
        alert(d.msg); 
      }else{
        commentBox.current.classList.add('hide');
        setCommentCount(x => x - 1); 
      }
      loading(false);
      target.classList.remove("cursor-default");
    }

  }

  return (
    <div className="comment" ref={commentBox}>
    <div>
    <span><Link to={window.PATH + "/channel/" + comment.userId}>{comment.username}</Link> <span className="comment-date">&#183; <ReactTimeAgo date={Date.parse(comment.date)} locale="en-US"/></span></span>
    <p>{comment.content}</p>
    </div>
    {allowDelete && <div title="Delete Comment" onClick={deleteClick}>{deleteText}</div>}
  </div>
  )
};

const CommentsList = ({data, setCommentCount}) => {
  return (<>
    {data.map(comment => (
      <Comment key={"comment"+comment.id} cid={comment.id} comment={comment} setCommentCount={setCommentCount} />
    ))}
    </>
  )
}


function FetchComments({videoId, commentCount, setCommentCount, page, setPage}) {
  const loadButton = useRef(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMore = () => {
    if(page < Math.ceil(commentCount/15)) {
      setPage(page => page + 1);
    }
  }
  
  useEffect(() => {
    if(!loading && page == Math.ceil(commentCount/15)) {
        loadButton.current.classList.add('hide');
    }
  }, [loading]);

  useEffect(() => {
    const loadComments = async () => {
      setLoading(true);
      const d = await fetchComments(videoId, page);
      if (!d.pass) {
        setLoading(false);
      }else{
        comment_count = d.count;
        setCommentCount(d.count);
        for(let i = 0; i < d.data.length; i++) {
          d.data[i].content = contentWithTags(d.data[i].content, d.tags);
        }
        setData((data) => [...data, ...d.data]);
        setLoading(false);
      }
    }
    loadComments();
  }, [page]);
  
  return (
    <>
    <CommentsList data={data} setCommentCount={setCommentCount} />
    {loading && commentLoading()}
    {!loading && (commentCount > 0) && <button className="loadmore" onClick={loadMore} ref={loadButton}>Load more comments...</button>}
    {!loading && (commentCount == 0) && <span className="comments-error"></span>}
    </>
  )
}

function contentWithTags(content, tags) {
  for(let tag in tags) {
    content = reactStringReplace(content, "@"+tag, () => (
      <Link to={window.PATH + "/channel/"+tags[tag]} key={"usrtag"+Math.random()}><span className='tag'>@{tag}</span></Link>
    ));
  }
  return content;
}


const MemoFetchComments = React.memo(FetchComments);


const Comments = ({videoId, isUserSignedIn}) => {
  const [ myComments, setMyComments ] = useState([]);
  const [ commentCount, setCommentCount ] = useState(comment_count);
  const [ myCommentCount, setMyCommentCount ] = useState(0);

  const [page, setPage] = useState(1);
  const listInnerRef = useRef();
  const updateMyComments = (item) => {
     setMyCommentCount(myCommentCount => myCommentCount + 1);
     setMyComments(items => [item].concat(items));
  }

  const onScroll = () => {
    if (listInnerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listInnerRef.current;
      if (scrollTop + clientHeight === scrollHeight) {
        if(page < Math.ceil(commentCount/15)) {
            setPage(page => page + 1);
        }
      }
    }
  };

  return (
    <>
    <h2>{(commentCount+myCommentCount > 0) ? (commentCount+myCommentCount) : ""} Comment{(commentCount+myCommentCount > 1) ? "s" : ""}</h2>
    {( isUserSignedIn && <AddComment videoId={videoId} updateMyComments={updateMyComments} setCommentCount={setMyCommentCount} />)}
    <div className="video-comments" onScroll={() => onScroll()} ref={listInnerRef}>
    { (myComments.length > 0) && <div className="my-comments">{myComments}</div>}
    <MemoFetchComments videoId={videoId} commentCount={commentCount} setCommentCount={setCommentCount} page={page} setPage={setPage} key={"COMD"+videoId} />
    </div>
    </>
  );
}

const Description = ({desc}) => {
  const [showMore, setShowMore] = useState(false);
  const ref = useRef();
  useEffect(() => {
        if (ref.current.clientHeight > 100) {
            setShowMore(true);
        }
  }, []);

  return (
    <div className={"description" + (!showMore ? " open" : "")}>
    <h3>Description</h3>
    <p ref={ref}><AddLinks options={{className:"a"}}>{desc}</AddLinks></p>
    <ToggleButton />
    </div>
  )
}

function unlockText() {
  return (<><i className="bi bi-key"></i></>);
}

function unlockLoading() {
  return (<><div className="loading"></div></>);
}

const PasswordBox = ({setWatchPassword}) => {
  const [password, setPassword] = useState("");
  const [submitText, setSubmitText] = useState(unlockText);
  const [disabled, setDisabled] = useState("");

  const onPasswordChange = (event) => setPassword(event.target.value);

  const onSubmitPassword = async (event) => {
    event.preventDefault();
    if(password != "") {
      setSubmitText(unlockLoading);
      setDisabled("disabled");
      setWatchPassword(password);
    }
  };

  return (
    <div className="content-middle" id="password-box">
    <div className="content-password">
    <h3 className="subtitle">This Video Is Protected</h3>
    <form className="password-form" onSubmit={onSubmitPassword}>
      <input type="password" className="input" placeholder='Enter Password' value={password} onChange={onPasswordChange} required autoFocus />
      <button className='submit' disabled={disabled}>{submitText}</button>
    </form>
    </div>
  </div>
  )
}

function Watch(props) {
    const { isUserSignedIn, setTitle, topRef } = props;
    const { id } = useParams();
    const [watchPassword, setWatchPassword] = useState("");

    const getData = async () => {
      const d = await watch(id, watchPassword);
      if (!d.pass) { setWatchPassword("");  throw new Error(d.msg); }
      return d.data[0];
    }

    const getRecommendations = async () => {
        const d = await fetchAlsoLike(id);
        if (!d.pass) throw new Error("error");
        return d.data;
    }

    varclear();

    useEffect(() => {
      topRef.current.scrollTop = 0;
    },[id]);


  return (
    <>
    <Async promiseFn={getData}>
    {({ data, error, isPending }) => {
      if (isPending) return (<><PCVideoWatch /></>);
      if (error) {
        if(error.message === "pw") {
          return (<><PCVideoWatch /><PasswordBox setWatchPassword={setWatchPassword} /></>)
        }else{
          return (<Error404 />)
        }
      }
      if (data) {
        setTitle(data.title);
        return ( 
          <div className='watch-content'>
        <h1 id="video-title">{data.title}</h1>
          <div className="video-content">
            <div id='video-player-box'>
            <div className="video-info">
            <div id="video-left-info">
            <span className="video-details"><i className="bi bi-eye-fill"></i> {data.views} Views</span>
            <span className="dot-padding">·</span>
            <span className="video-details">Uploaded <ReactTimeAgo date={Date.parse(data.uploadDate)} locale="en-US"/></span>
            </div>
            <div id="video-right-info">
               <LikeButton likes={data.likes} videoId={id} didLike={data.didLike} isUserSignedIn={isUserSignedIn} />
            </div>
        </div>
        <Player
             poster={"" + window.SERVER + "/video_thumbnails/" + data.thumbnailPath}
             src={"" + window.SERVER + "/videos/" + data.videoPath}
             fluid={false}
             width="100%"
             autoPlay
             />
            </div>
             <div className="video-chat">
             <div id="video-publisher">
             <Link to={window.PATH + "/channel/" + data.userId}>
              <img src={"" + window.SERVER + "/user_thumbnails/" + (data.picturePath ? data.picturePath : "default.png")} />
              <div className="publisher-details">{data.username}<div>{data.subscribers} Subscribers</div></div>
            </Link>
            </div>
                <Comments videoId={id} isUserSignedIn={isUserSignedIn} />
             </div>
             </div>
             <Description desc={data.description} />
             <h2 id="recommendationTitle">You Might Also Like</h2>
             <Async promiseFn={getRecommendations}>
                {({ data, error, isPending }) => {
                if (isPending) return (<><div className="row"><PCChannel /></div><div className="row"><PCChannel /></div></>)
                if (error) return;
                if (data)
                return ( 
                  <>
                  <div className="row">
                  {data.map(video => <VideoBox video={video} col="3" key={"recommended"+video.id} />)}
                  </div>
                  </>
                )
              return null
               }}
            </Async>
          </div>
        )
    }
    }}

  </Async>
  </>
  );
}

export default Watch;
