import React from 'react'

function PCVideoRow() {
  return (<>
       <div className="module PCVideoRow"></div>
       <div className="module PCVideoRow"></div>
       <div className="module PCVideoRow"></div>
        </>
  );
}

function PCResultRow() {
  return (<>
       <div className="module PCResultRow"></div>
       <div className="module PCResultRow"></div>
       <div className="module PCResultRow"></div>
       <div className="module PCResultRow"></div>
       <div className="module PCResultRow"></div>
       <div className="module PCResultRow"></div>
        </>
  );
}

function PCVideoTrending() {
  return (<>
       <div className="module PCVideoTrending"></div>
       <div>
       <div className="module PCVideoRow"></div>
       <div className="module PCVideoRow"></div>
       <div className="module PCVideoRow"></div>
       </div>
       <div>
       <div className="module PCVideoRow"></div>
       <div className="module PCVideoRow"></div>
       <div className="module PCVideoRow"></div>
       </div>
       <div>
       <div className="module PCVideoRow"></div>
       <div className="module PCVideoRow"></div>
       <div className="module PCVideoRow"></div>
       </div>
        </>
  );
}

function PCSubscription() {
  return (<>
    <div className="module PCSubscription"></div>
     </>
  );
}

function PCFormLabel() {
  return (<>
    <div className="module PCFormLabel"></div>
    <div className="module PCFormText"></div>
     </>
  );
}

function PCFormPicture() {
  return (
    <>
      <div className="module PCChannels" style={{margin: "10px 20px"}}></div>
      <div className="module PCPictureButton"></div>
    </>
  )
}

function PCFormCheck() {
  return (
    <>
      <div className="module PCFormCheck"></div>
    </>
  )
}


export { PCVideoRow, PCVideoTrending, PCSubscription, PCResultRow, PCFormLabel, PCFormPicture, PCFormCheck };
