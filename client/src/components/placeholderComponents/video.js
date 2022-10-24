import React from 'react'

function PCVideoWatch() {
  return (<>
         <div className="module PCWatchHead"></div>
         <div>
         <div className="module PCWatchVideo"></div>
         <div className="module PCWatchComment"></div>
         </div>
         <div className="module PCResultRow"></div>
        </>
  );
}

function PCRecommendationsWatch() {
    return (<>
           <div className="module PCChannelRow"></div>
          </>
    );
  }

export { PCVideoWatch, PCRecommendationsWatch };
