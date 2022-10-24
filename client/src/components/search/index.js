import React, { useEffect, useState, useRef } from 'react'
import { search } from '../../api';
import VideoBox from "../video/videoBox";
import { useParams } from "react-router-dom";
import Error404 from "../errors/error404";
import { PCChannel } from "../placeholderComponents/channel"
import { Nav, Navbar, NavDropdown} from 'react-bootstrap';
import Container from 'react-bootstrap/Container';

const SearchRows = ({data}) => {
  return (<>
    {data.map(video => (<VideoBox video={video} col="3" key={"recommended"+video.id} />))}
    </>
  );
}

const Desc = () => {
  return (<i className="bi bi-arrow-down-short" title="Descending"></i>);
}
const Asc = () => {
  return (<i className="bi bi-arrow-up-short" title="Ascending"></i>);
}

const SearchResult = ({query}) => {
  const loadButton = useRef(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [orderby, setOrderby] = useState([]);
  const [dateDesc, setDateDesc] = useState(true);
  const [viewsDesc, setViewsDesc] = useState(true);
  const [sortTitle, setSortTitle] = useState("Sort by..");
  const [active, setActive] = useState("");

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
      const d = await search(decodeURI(query), page, orderby);
      if (!d.pass) {
        setLoading(false);
      }else{
        setCount(d.count);
        setData((data) => [...data, ...d.data]);
        setLoading(false);
      }
    }
    loadVideos();
  }, [page, orderby]);

  const sortRelevance = (e) => {
    clearResults();
    setOrderby([]);
    setSortTitle(<>Sort by relevance</>);
    setActive("");
  }

  const sortDate = () => {
    clearResults();
    setOrderby(["date",(dateDesc) ? "desc" : ""]);
    setDateDesc(!dateDesc);
    setSortTitle(<>Sort by date ( {((dateDesc) ? (<Desc />) : <Asc />)} )</>);
    setActive("date");
  }

  const sortViews = () => {
    clearResults();
    setOrderby(["views",(viewsDesc) ? "desc" : ""]);
    setViewsDesc(!viewsDesc);
    setSortTitle(<>Sort by views ( {((viewsDesc) ? (<Desc />) : <Asc />)} )</>);
    setActive("views");
  }

  const clearResults = () => {
    setPage(1);
    setData([]);
  }

  return (<>
    <div id="filter">
    <h1>{count} Results</h1>
    <Navbar bg="light">
             <Container>
<Navbar.Toggle aria-controls="basic-navbar-nav" />
<Navbar.Collapse id="basic-navbar-nav">
  <Nav className="me-auto">
    <NavDropdown title={sortTitle} id="basic-nav-dropdown">
    <NavDropdown.Item onClick={sortRelevance} id={(active=="") ? "dditem-active" : ""}>Relevance</NavDropdown.Item>
    <NavDropdown.Item onClick={sortDate} id={(active=="date") ? "dditem-active" : ""}>
      Date 
      {(dateDesc && <Desc />)}
      {(!dateDesc && <Asc />)}
    </NavDropdown.Item>
    <NavDropdown.Item onClick={sortViews} id={(active=="views") ? "dditem-active" : ""}>
      Views 
      {(viewsDesc && <Desc />)}
      {(!viewsDesc && <Asc />)}
    </NavDropdown.Item>
    </NavDropdown>
  </Nav>
</Navbar.Collapse>
</Container>
</Navbar>
</div>
    <div className="row">
    <SearchRows data={data} />
    </div>
    {loading && <><PCChannel /><PCChannel /></> }
    {!loading && (count > 0) && <button className="loadmore loadmorevideo" onClick={loadMore} ref={loadButton}>Load more videos...</button>}
    {!loading && (count == 0) && <Error404 />}
    </>
  )
}

function Search({setTitle, topRef}) {
    const { query } = useParams();
    setTitle(decodeURI(query));

    useEffect(() => {
      topRef.current.scrollTop = 0;
    },[]);

    return (
      <SearchResult key={query} query={query} />
    )
}

export default Search;
