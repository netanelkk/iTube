import React from 'react'

function PCChannelHead() {
  return (<>
         <div className="module PCChannelHead"></div>
        </>
  );
}

function PCChannel() {
    return (<>
            <div className="module PCChannelRow"></div>
            <div className="module PCChannelRow"></div>
            <div className="module PCChannelRow"></div>
            <div className="module PCChannelRow"></div>
          </>
    );
}

function PCChannels() {
  return (<>
          <div className='col-lg-3 col-md-4 col-sm-6 PCChannelsWrap'><div className="module PCChannels"></div><div className="module PCChannelName"></div></div>
          <div className='col-lg-3 col-md-4 col-sm-6 PCChannelsWrap'><div className="module PCChannels"></div><div className="module PCChannelName"></div></div>
          <div className='col-lg-3 col-md-4 col-sm-6 PCChannelsWrap'><div className="module PCChannels"></div><div className="module PCChannelName"></div></div>
          <div className='col-lg-3 col-md-4 col-sm-6 PCChannelsWrap'><div className="module PCChannels"></div><div className="module PCChannelName"></div></div>
          </>
  );
}

function PCAbout() {
  return (<>
    <div className="module PCAbout"></div>
   </>
);
}


export { PCChannel, PCChannelHead, PCChannels, PCAbout };
