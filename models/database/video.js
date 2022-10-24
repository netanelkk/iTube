const sql = require("..");
var async = require("async");
const util = require('util');
const Notification = require("./notification.js");
const User = require("./user.js");

// constructor
const Video = function(v) {
  this.title = v.title;
  this.description = v.description;
  this.uploadDate = v.uploadDate;
  this.duration = v.duration;
  this.views = v.views;
  this.videoPath = v.videoPath;
  this.thumbnailPath = v.thumbnailPath;
  this.publisher = v.publisher;
  this.password = v.password
};

const PAGE_OFFSET = 12;
const COMMENT_PAGE_OFFSET = 15;

Video.fetchNew = () => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT V.id, V.title, V.description, V.uploadDate, V.duration, V.videoPath, V.thumbnailPath, V.publisher,
                U.username, U.picturePath, U.id as userId, count(VW.id) as views
                FROM video V 
                JOIN user U 
                ON U.id = V.publisher
                LEFT JOIN view VW
                ON VW.videoId = V.id 
                WHERE V.password = ""
                GROUP BY V.id
                ORDER BY V.uploadDate DESC LIMIT 6`, (err, res) =>{
      if (err) { return reject(err);} 
      if (res.length == 0) { return reject(); }
      return resolve(res);
   });
  });
};

Video.popularNow = () => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT V.id, V.title, V.description, V.uploadDate, V.duration, V.videoPath, V.thumbnailPath, V.publisher,
                U.username, U.id as userId, U.picturePath,
               (SELECT COUNT(videoId) FROM view WHERE videoId=V.id) as views,
                count(L.id) as likes
                    FROM video V 
                    JOIN user U 
                    ON  U.id = V.publisher
                    LEFT JOIN \`like\` L
                    ON L.videoId = V.id ` +
                   // WHERE DATEDIFF(now(), V.uploadDate) < 30
                    ` AND V.password = ""
                    GROUP BY V.id
                    ORDER BY count(L.id) DESC LIMIT 6`, (err, res) =>{
      if (err) { return reject(err);} 
      if (res.length == 0) { return reject(); }
      return resolve(res);
   });
  });
}

Video.trending = (days) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT V.id, V.title, V.description, V.uploadDate, V.duration, V.videoPath, V.thumbnailPath, V.publisher,
                U.username, U.picturePath, U.id as userId, count(VW.id) as views 
                FROM video V 
                JOIN user U 
                ON  U.id = V.publisher
                LEFT JOIN view VW
                ON VW.videoId = V.id ` +
                // WHERE DATEDIFF(now(), V.uploadDate) < ?
                ` AND V.password = ""
                GROUP BY V.id
                ORDER BY count(VW.id) DESC LIMIT 16`, [days], (err, res) =>{
      if (err) { return reject(err);} 
      if (res.length == 0) { return reject(); }
      return resolve(res);
   });
  });
}

Video.fetch = (id, pw) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT V.*,
                      U.username, U.id as userId, U.picturePath,
                     (SELECT COUNT(videoId) FROM view WHERE videoId=?) as views,
                     (SELECT COUNT(videoId) FROM \`like\` WHERE videoId=?) as likes,
                     count(S.id) as subscribers
              FROM video V 
              JOIN user U 
              ON U.id = V.publisher
              LEFT JOIN subscribe S
              ON V.publisher = S.subscribedTo
              WHERE V.id=?`,[id,id,id], (err, res) =>{
      if (err) { return reject(err);} 
      if (res.length == 0) { return reject(); }
      if (res[0].password !== pw) { return reject("pw"); }
      return resolve(res);
   });
  });
};

Video.details = (id) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT * FROM video WHERE id=?`,[id], (err, res) =>{
      if (err) { return reject(err);} 
      if (res.length == 0) { return reject(); }
      return resolve(res);
   });
  });
};

Video.addView = (videoId, ip, userId=null) => {
      sql.query(`INSERT INTO view (videoId,ip,userId) VALUES(?,?,?)`,[videoId, ip, userId], (err) => {
        // console.log(err);
      });
}


Video.addLike = (videoId, userId) => {
  return new Promise((resolve,reject) => {
    sql.query(`INSERT INTO \`like\` (videoId,userId) VALUES(?,?)`,[videoId, userId], (err) => {
      if (err) { return reject(err); } 
      return Video.details(videoId).then(rows => {
        Notification.allowed(rows[0].publisher, Notification.NotiType.LIKE).then(allowed => {
        if(userId != rows[0].publisher && allowed) {
          const notification = {
            userId: rows[0].publisher,
            from: userId,
            videoId,
            type: Notification.NotiType.LIKE
          }
          Notification.new(notification).then(result => {
            return resolve(result.insertId);
          }).catch((e) => {
            return reject(e);
          });
        }else{
          return resolve();
        }
      }).catch(() => {
        return resolve();
      });
      }).catch((e) => {
        return reject(e);
      });
     });
 });
}

Video.removeLike = (videoId, userId) => {
  return new Promise((resolve,reject) => {
    sql.query(`DELETE FROM \`like\` WHERE videoId=? AND userId=?`,[videoId, userId], (err) => {
      if (err) { return reject(err);} 
      return resolve();
     });
 });
}

Video.didLike = (videoId, userId) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT count(*) AS totalRows FROM \`like\` WHERE videoId=? AND userId=?`,[videoId, userId], (err,res) => {
      if (err) { return reject(err);} 
      return resolve(res);
     });
 });
}

Video.fetchComments = (videoId, page) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT C.*, U.username, U.id as userId
                FROM comment C
                JOIN user U
                ON C.userId = U.id
                WHERE videoId=? ORDER BY C.id DESC LIMIT ?, ?`,[videoId, (page-1)*COMMENT_PAGE_OFFSET, COMMENT_PAGE_OFFSET], (err, res) => {
      if (err) { return reject(err);} 
      if (res.length == 0) { return reject(); }
      return resolve(res);
   });
  });
}

Video.countComments = (videoId) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT id FROM comment WHERE videoId=?`,[videoId], (err, res) => {
      if (err) { return reject(err);} 
      return resolve(res.length);
   });
  });
}

Video.fetchComment = (id) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT C.*, U.username, U.id as userId
               FROM comment C
               JOIN user U
               ON C.userId = U.id
               WHERE C.id=?`,[id], (err, res) => {
      if (err) { return reject(err);} 
      if (res.length == 0) { return reject(); }
      return resolve(res);
   });
  });
}

Video.addComment = (userId, videoId, content) => {
  return new Promise((resolve,reject) => {
    sql.query(`INSERT INTO comment (userId, videoId, content) VALUES(?,?,?)`,[userId, videoId, content], (err, res) => {
      if (err) { return reject(err); } 
      return Video.details(videoId).then(rows => {
        Notification.allowed(rows[0].publisher, Notification.NotiType.NEWCOMMENT).then(allowed => {
          if(userId != rows[0].publisher && allowed) {
            const notification = {
              userId: rows[0].publisher,
              from: userId,
              videoId: videoId,
              type: Notification.NotiType.NEWCOMMENT
            }
            Notification.new(notification).then(result => {
              return resolve([res.insertId, result.insertId]);
            }).catch((e) => {
              return reject(e);
            });
          }else{
            return resolve([res.insertId]);
          }
        }).catch(() => {
          return resolve([res.insertId]);
        });
      }).catch((e) => {
        return reject(e);
      });
   });
  });
}

function sortCorrelations(obj={}, keys = 0) { 
  var sortable = [];
  for (var x in obj ) {
      sortable.push([x, obj[x]]);
  }
  sortable.sort(function(a, b) {
      return b[1].corr - a[1].corr;
  });
  return sortable.map((item) => item[keys]);
}

Video.correlation = (title ,ignoreId = 0) => {
  const words = title.replace(/[^a-zA-Z ]/g, "").split(" ").filter((item) => (item.length >= 2));
  const correlations = {};
  const raisePercentage = (percent) => { return Number((((words.length*percent)+1)/words.length).toFixed(2)); };
  return new Promise((resolve,reject) => {
  async.each(words,function(item,cb) {
    sql.query(`SELECT V.id, V.title, V.description, V.uploadDate, V.duration, V.videoPath, V.thumbnailPath, V.publisher
               FROM video V 
               WHERE (title LIKE ? OR description LIKE ?) 
               AND id != ? 
               AND V.password=""`
    ,['%'+item+'%','%'+item+'%', ignoreId], (err, res) => {
      if (err) { reject(err); } 
      for (const row of res) {
        if(correlations[row.id] === undefined) {
          correlations[row.id] = { id: row.id };
          correlations[row.id].corr = 0;
        }
        correlations[row.id].corr = raisePercentage(correlations[row.id].corr);
      }
      cb();
   });
  }, function() {
    resolve(correlations);
  });
});
}

const query = util.promisify(sql.query).bind(sql);
Video.search = (searchQuery, page = 1, orderby, limit = PAGE_OFFSET, videoId = 0) => {
  return new Promise((resolve,reject) => {
    Video.correlation(searchQuery,videoId).then(async rows => {
    let matches = "0";
    if(Object.keys(rows).length > 0) {
      matches = sortCorrelations(rows);
    }
    await query(`SELECT * FROM (
                      SELECT * FROM (
                      (SELECT V.id, V.title, V.description, V.uploadDate as uploadDate, V.duration, V.videoPath, V.thumbnailPath, V.publisher,
                        U.username, U.picturePath, count(VW.id) as views, U.id as userId
                        FROM video V 
                        JOIN user U 
                        ON  U.id = V.publisher
                        LEFT JOIN view VW
                        ON VW.videoId = V.id 
                        WHERE V.id in `+ ["("+matches+")"] +`
                        AND V.password = ""
                        GROUP BY V.id
                        ORDER BY FIELD(V.id, `+ [matches] +`))) a
                        UNION ALL
                        SELECT * FROM (
                        (SELECT V.id, V.title, V.description, V.uploadDate as uploadDate, V.duration, V.videoPath, V.thumbnailPath, V.publisher,
                              U.username, U.picturePath, count(VW.id) as views, U.id as userId
                              FROM video V 
                              JOIN user U 
                              ON  U.id = V.publisher
                              LEFT JOIN view VW
                              ON VW.videoId = V.id 
                              WHERE V.id not in `+ ["("+matches+")"] +`
                              AND V.password = ""
                              AND V.id != ?
                              GROUP BY V.id
                              ORDER BY V.uploadDate DESC LIMIT 8)) b
                          ) as x `+
                          ((orderby[0] === "date") ? `ORDER BY uploadDate` : ``) +
                          ((orderby[0] === "views") ? `ORDER BY views` : ``) +
                          ((orderby[1] === "desc") ? ` DESC` : ``) +
                          ((limit > 0) ? ` LIMIT ?, ?` : ``),[videoId, (page-1)*limit, limit], (err, res) => {
          if (err) { return reject(err);} 
          if (res.length == 0) { return reject(); }
          if(videoId != 0) {
            for(let i = 0; i < res.length; i++) {
              if(rows[res[i].id] === undefined) {
                res[i].corr = 0;
              }else{
                res[i].corr = rows[res[i].id].corr;
              }
            }
          }
        return resolve(res);
    });
    return reject("ERROR #3");
  });
  });
};

Video.alsoLike = (videoId) => {
  return new Promise((resolve,reject) => {
  sql.query(`SELECT title
            FROM video
            WHERE id=?`,[videoId], async (err, res) =>{
    if (err) { return reject(err);} 
    if (res.length == 0) { return reject("ERROR #2"); }
    return Video.search(res[0].title, 1, '', 8, videoId).then(result => {
      return resolve(result);
    }).catch(e => {
      return reject(e);
    });
    });
 });
}

Video.channel = (id, userId, page) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT V.id, V.title, V.description, V.uploadDate, V.duration, V.videoPath, V.thumbnailPath, V.publisher,
                count(VW.id) as views, (SELECT COUNT(*) FROM video WHERE publisher=?` +
                (id!=userId ? ` AND password='' ` : ` `) +`) as count,
                (CASE WHEN V.password != '' THEN 'LOCKED' ELSE '' END) as password
                FROM video V 
                LEFT JOIN view VW
                ON VW.videoId = V.id 
                WHERE V.publisher = ?` +
                (id!=userId ? ` AND V.password='' ` : ` `) +
                `GROUP BY V.id
                ORDER BY V.uploadDate DESC LIMIT ?, ?`, [id, id, (page-1)*PAGE_OFFSET, PAGE_OFFSET], (err, res) =>{
      if (err) { return reject(err);} 
      if (res.length == 0) { return reject(); }
      return resolve(res);
   });
  });
};

Video.channelLiked = (id, userId, page) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT V.id, V.title, V.description, V.uploadDate, V.duration, V.videoPath, V.thumbnailPath, V.publisher,
                count(VW.id) as views, 
                (SELECT COUNT(*) 
                FROM \`like\` L1 
                JOIN video V1
                ON L1.videoId = V1.id
                 WHERE userId=?` +
                (id!=userId ? ` AND V1.password='' ` : ` `) +`) as count,
                (CASE WHEN V.password != '' THEN 'LOCKED' ELSE '' END) as password,
                U.username, U.id as userId, U.picturePath
                FROM \`like\` L
                JOIN video V
                ON L.videoId = V.id
                LEFT JOIN view VW
                ON VW.videoId = V.id 
                JOIN user U
                ON V.publisher = U.id
                WHERE L.userId = ?` +
                (id!=userId ? ` AND V.password='' ` : ` `) +
                `GROUP BY V.id
                ORDER BY L.date DESC LIMIT ?, ?`, [id, id, (page-1)*PAGE_OFFSET, PAGE_OFFSET], (err, res) =>{
      if (err) { return reject(err);} 
      if (res.length == 0) { return reject(); }
      return resolve(res);
   });
  });
};

Video.subscriptions = (userId) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT V.id, V.title, V.description, V.uploadDate, V.duration, V.videoPath, V.thumbnailPath, V.publisher,
                U.username, U.picturePath, U.id as userId, count(VW.id) as views 
                FROM video V 
                JOIN user U 
                ON  U.id = V.publisher
                LEFT JOIN view VW
                ON VW.videoId = V.id 
                WHERE V.publisher in (SELECT S.subscribedTo
                                      FROM subscribe S
                                      WHERE S.userId = ?)
                AND V.password = ""
                GROUP BY V.id
                ORDER BY V.id DESC LIMIT 50`,[userId], (err, res) =>{
      if (err) { return reject(err);} 
      if (res.length == 0) { return reject(); }
      return resolve(res);
   });
  });
}

Video.history = (userId, page) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT V.id, V.title, V.description, V.uploadDate, V.duration, V.videoPath, V.thumbnailPath, V.publisher,
               U.username, U.picturePath, U.id as userId, count(VW.id) as views,
               VW.date as historyDate
                    FROM video V 
                    JOIN user U 
                    ON  U.id = V.publisher
                    LEFT JOIN view VW
                    ON VW.videoId = V.id 
                    WHERE VW.id IN (SELECT id
                                    FROM view 
                                    WHERE userId = ?)
                    GROUP BY V.id
                    ORDER BY VW.id DESC ` + 
                    ((page > 0) ? `LIMIT ?, ?` : ``), [userId, (page-1)*PAGE_OFFSET, PAGE_OFFSET], (err, res) =>{
      if (err) { return reject(err);} 
      if (res.length == 0) { return reject(); }
      return resolve(res);
   });
  });
}

Video.likes = (userId, page) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT V.id, V.title, V.description, V.uploadDate, V.duration, V.videoPath, V.thumbnailPath, V.publisher,
                    U.username, U.picturePath, U.id as userId, count(VW.id) as views
                    FROM video V 
                    JOIN user U 
                    ON  U.id = V.publisher
                    LEFT JOIN view VW
                    ON VW.videoId = V.id 
                    JOIN \`like\` L
                    ON L.videoId = V.id AND L.userId = ?
                    GROUP BY V.id
                    ORDER BY L.id DESC ` + 
                    ((page > 0) ? `LIMIT ?, ?` : ``), [userId, (page-1)*PAGE_OFFSET, PAGE_OFFSET], (err, res) =>{
      if (err) { return reject(err);} 
      if (res.length == 0) { return reject(); }
      return resolve(res);
   });
  });
}

Video.add = async (newVideo) => {
  delete newVideo.registerDate; // in order to set default sql value
  return new Promise((resolve,reject) => {
    sql.query("INSERT INTO video SET ?", newVideo, (err, res) =>{
      if (err) { return reject(err); } 
      User.subscriptionsOf(newVideo.publisher).then(async (rows) => {
        const notiList = [];
        if(newVideo.password.length == 0) {
        for(let i = 0; i < rows.length; i++) {
          await Notification.allowed(rows[i].userId, Notification.NotiType.NEWVIDEOFROMSUBSCRIPTION).then(async (allowed) => {
            if(allowed) {
              const notification = {
                userId: rows[i].userId,
                from: newVideo.publisher,
                videoId: res.insertId,
                type: Notification.NotiType.NEWVIDEOFROMSUBSCRIPTION
              }
              await Notification.new(notification).then(result => {
                notiList.push(result.insertId);
              }).catch((e) => {
                return reject(e);
              });
            }
        }).catch(() => {});         
      }
    }
        return resolve([res.insertId, notiList]);
      }).catch(e => {
        return reject(e);
      });
   });
  });
};



Video.updateTitle = (videoId, userId, title) => {
  return new Promise((resolve,reject) => {
    sql.query(`UPDATE video SET title=? WHERE id=? AND publisher=?`, [title,videoId, userId], (err, res) =>{
      if (err) { return reject(err);} 
      return resolve(res);
   });
  });
}

Video.updatePrivate = (videoId, userId, password) => {
  return new Promise((resolve,reject) => {
    sql.query(`UPDATE video SET password=? WHERE id=? AND publisher=?`, [password,videoId, userId], (err, res) =>{
      if (err) { return reject(err);} 
      return resolve(res);
   });
  });
}

Video.delete = (videoId, userId) => {
  return new Promise((resolve,reject) => {
      sql.query(`DELETE FROM video WHERE id=? AND publisher=?`, [videoId, userId], (err, res) =>{
        if (err) { return reject(err);} 
        return resolve();
      });
  });
}

Video.deleteComment = (commentId, userId) => {
  return new Promise((resolve,reject) => {
    sql.query(`DELETE FROM comment WHERE id=? AND userId=?`, [commentId, userId], (err, res) =>{
      if (err) { return reject(err); } 
      if(res.affectedRows == 0) { return reject("Action couldn't complete"); }
      return resolve(res);
   });
  });
}

module.exports = Video;
