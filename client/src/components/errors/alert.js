import React, { useEffect } from 'react'

var errorbox;
function Alert({message, close, success}) {

    useEffect(() => {
      if(errorbox) {
        clearTimeout(errorbox);
      }
        errorbox = setTimeout(function() {
            close();
        },5000);
    },[]);

    return (<div className={'alert' + ((success) ? " alert-success" : "")}>
      <h2>
        { (success) ? <><i className="bi bi-check-circle"></i> SUCCESS</> : <><i className="bi bi-info-circle"></i> ALERT</> }
        <div><div id="modal-close" onClick={close}><i className="bi bi-x"></i></div></div>
      </h2>
      <div>{message}</div>
    </div>);
}

export default Alert;
