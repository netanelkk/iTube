const sql = require("..");

const NOTIFICATIONS_OFFSET = 5;

// constructor
const Notification = function(n) {
  this.userId = n.userId;
  this.from = n.from;
  this.date = n.date;
  this.videoId = n.videoId;
  this.type = n.type;
};

Notification.NotiType = {
    NEWCOMMENT: 1,
    NEWSUBSCRIBER: 2,
    NEWVIDEOFROMSUBSCRIPTION: 3,
    LIKE: 4,
    MENTION: 5
}

Notification.new = (notification) => {
  delete notification.date; // in order to set default sql value
  if(notification.type == Notification.NotiType.NEWSUBSCRIBER) {
        delete notification.videoId;
  }
  return new Promise((resolve,reject) => {
    sql.query(`INSERT INTO notification SET ?`, notification, (err, res) =>{
      if (err) { return reject(err);} 
      return resolve(res);
   });
  });
};

Notification.fetch = (userId, page = -1, notiId = -1) => {
    return new Promise((resolve,reject) => {
        sql.query(`SELECT N.id, N.userId, N.from, U.username fromUsername, U.picturePath, N.date, N.type, V.id as videoId, V.title, N.viewed
                    FROM notification N
                    LEFT JOIN video V
                    ON V.id = N.videoId
                    LEFT JOIN user U
                    ON U.id = N.from
                    WHERE ` +
                    ((notiId > 0) ? `N.id=`+notiId : `N.userId=`+userId) +
                    ` ORDER BY N.id DESC ` + 
                    ((page > 0) ? `LIMIT ?, ?` : ``),[(page-1)*NOTIFICATIONS_OFFSET, NOTIFICATIONS_OFFSET], (err, res) => {
          if (err) { return reject(err);} 
          if (res.length == 0) { return reject(); }
          return resolve(res);
       });
    });
};

Notification.view = (userId) => {
  return new Promise((resolve,reject) => {
    sql.query(`UPDATE notification SET viewed=1 WHERE userId=?`,[userId], (err, res) => {
      if (err) { return reject(err);} 
      return resolve(res);
   });
  });
}

Notification.fetchById = (notiId) => {
  return Notification.fetch(-1,-1,notiId);
}

Notification.allowed = (userId, notiType) => {
  return new Promise((resolve,reject) => {
      sql.query(`SELECT newcomment, newsub, newvid, \`like\`, mention
                 FROM settings WHERE userId=?`,[userId], (err, res) => {
        if (err) { return reject(false); } 
        if (res.length == 0) { return reject(false); }
        let keys = Object.keys(res[0]);
        return resolve((res[0][keys[notiType-1]]===1));
     });
  });
};


module.exports = Notification;
