const sql = require("..");
const bcrypt = require('bcryptjs');
const Notification = require("./notification.js");
const { Result } = require("express-validator");

const PAGE_OFFSET = 12;

// constructor
const User = function(u) {
  this.username = u.username;
  this.password = u.password;
  this.email = u.email;
  this.picturePath = u.picturePath;
  this.registerDate = u.registerDate;
};

User.register = async (newUser) => {
  delete newUser.registerDate; // in order to set default sql value
  newUser.password = await bcrypt.hash(newUser.password, 10);
  return new Promise((resolve,reject) => {
    sql.query("INSERT INTO user SET ?", newUser, (err, res) =>{
      if (err) { return reject(err); } 
      User.initSettings(res.insertId);
      return resolve(res);
   });
  });
};

User.auth = (username, password) => {
  const global_error = "Invalid username/password";
  return new Promise((resolve,reject) => {
    sql.query(`SELECT * FROM user WHERE username = ?`, [username], (err, res) =>{
      if (err) { return reject(err);} 
      if (res.length == 0) { return reject(global_error); }
      if (!bcrypt.compareSync(password, res[0].password)) { return reject(global_error); } 
      return resolve(res);
   });
  });
};

User.authToken = (id, email) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT * FROM user WHERE id = ? AND email = ?`, [id, email], (err, res) =>{
      if (err) { return reject(err);} 
      if (res.length == 0) { return reject(); }
      return resolve(res);
   });
  });
};

User.details = (id) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT id, username, picturePath, registerDate, email, about,
              (SELECT COUNT(id) FROM subscribe WHERE subscribedTo=?) as subscribers
                FROM user WHERE id = ?`, [id,id], (err, res) =>{
      if (err) { return reject(err);} 
      if (res.length == 0) { return reject(); }
      return resolve(res);
   });
  });
};

User.subscribe = (userId, subscribedTo) => {
  return new Promise((resolve,reject) => {
    sql.query(`INSERT INTO subscribe (userId,subscribedTo) VALUES(?,?)`,[userId, subscribedTo], (err) => {
      if (err) { return reject(err); } 
      Notification.allowed(subscribedTo, Notification.NotiType.NEWSUBSCRIBER).then(allowed => {
      if(allowed) {
        const notification = {
          userId: subscribedTo,
          from: userId,
          type: Notification.NotiType.NEWSUBSCRIBER
        }
        Notification.new(notification).then(rows => {
           return resolve(rows.insertId);
        }).catch(e => {
          return reject(e);
        });
      }else{
        return resolve();
      }
    }).catch(() => {
      return resolve();
    });
    });
 });
}

User.isSubscribed = (userId, subscribedTo) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT id FROM subscribe WHERE userId=? AND subscribedTo=?`,[userId, subscribedTo], (err,res) => {
      if (err) { return reject(err); } 
      if (res.length == 0) { return reject("No results..."); }
      return resolve();
     });
 });
}

User.unsubscribe = (userId, subscribedTo) => {
  return new Promise((resolve,reject) => {
    sql.query(`DELETE FROM subscribe WHERE userId=? AND subscribedTo=?`,[userId, subscribedTo], (err) => {
      if (err) { return reject(err);} 
      return resolve();
     });
 });
}

// subscription list of {userId}
User.subscriptions = (userId, page) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT U.id, U.username, U.picturePath,
                    (SELECT COUNT(*) FROM subscribe WHERE userId=?) as count,
                        count(S2.id) as subscribers
              FROM subscribe S
              JOIN user U
              ON S.subscribedTo = U.id
              LEFT JOIN subscribe S2
              ON S2.subscribedTo = S.subscribedTo
              WHERE S.userId = ?
              GROUP BY S2.subscribedTo
              ORDER BY S.id DESC LIMIT ?, ?`, [userId, userId, (page-1)*PAGE_OFFSET, PAGE_OFFSET], (err, res) =>{
      if (err) { return reject(err);} 
      if (res.length == 0) { return reject(); }
      return resolve(res);
   });
  });
}

// list of all users that subscribed to {userId}
User.subscriptionsOf = (userId) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT userId FROM subscribe WHERE subscribedTo = ?`, [userId], (err, res) =>{
      if (err) { return reject(err);} 
      if (res.length == 0) { return reject(); }
      return resolve(res);
   });
  });
}


User.updatePicture = (userId, picturePath) => {
  return new Promise((resolve,reject) => {
    sql.query(`UPDATE user SET picturePath=? WHERE id=?`, [picturePath, userId], (err, res) =>{
      if (err) { return reject(err);} 
      return resolve(res);
   });
  });
}

User.updateDetails = (userId, email, password) => {
  return new Promise((resolve,reject) => {
    sql.query(`UPDATE user SET email=?, password=? WHERE id=?`, [email,password, userId], (err, res) =>{
      if (err) { return reject(err);} 
      return resolve(res);
   });
  });
}

User.search = (username, ignore = "") => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT username, picturePath FROM user WHERE username LIKE ? ` + 
              (ignore !== "" ? ` AND username != ?` : ``) +
              `LIMIT 6` , ['%'+username+'%', ignore], (err, res) =>{
      if (err) { return reject(err);} 
      if (res.length == 0) { return reject(); }
      return resolve(res);
   });
  });
};

User.searchTag = (username) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT id FROM user WHERE username = ?`, [username], (err, res) =>{
      if (err) { return reject(err);} 
      if (res.length == 0) { return resolve(0); }
      return resolve(res);
   });
  });
};

User.initSettings = (userId) => {
  return new Promise((resolve,reject) => {
    sql.query(`INSERT INTO settings (userId) values(?)`, [userId], (err, res) =>{ 
      if (err) { return reject(err);} 
      return resolve(res);
   });
  });
}

User.notiSettings = (userId) => {
  return new Promise((resolve,reject) => {
    sql.query(`SELECT newcomment, newsub, newvid, \`like\`, mention
                 FROM settings WHERE userId = ?`, [userId], (err, res) =>{
      if (err) { return reject(err); } 
      if (res.length == 0) { 
        User.initSettings(userId).then(() => {
          return resolve(0);
        }).catch(e => {
          return reject(e);
        });
      }else{
        return resolve(res);
      }
   });
  });
}

User.updateSettings = (userId, settings) => {
  return new Promise((resolve,reject) => {
    sql.query(`UPDATE settings SET newcomment=?, newsub=?, newvid=?, \`like\`=?, mention=? WHERE userId=?`, 
    [settings.newcomment, settings.newsub, settings.newvid, settings.like, settings.mention, userId], (err, res) =>{
      if (err) { return reject(err);} 
      return resolve(res);
   });
  });
}

User.updateProfile = (userId, about) => {
  return new Promise((resolve,reject) => {
    sql.query(`UPDATE user SET about=? WHERE id=?`, [about, userId], (err, res) =>{
      if (err) { return reject(err);} 
      return resolve(res);
   });
  });
}

User.totalViews = (userId) => {
  return new Promise((resolve,reject) => {
  sql.query(`SELECT count(VW6.id) count6, count(VW5.id) count5, 
                count(VW4.id) count4, count(VW3.id) count3, count(VW2.id) count2, count(VW.id) count
             FROM user U
             LEFT JOIN video V
                ON U.id = V.publisher AND V.password = ""
             LEFT JOIN view VW
                ON VW.videoId = V.id AND MONTH(VW.date) = MONTH(CURDATE())
             LEFT JOIN view VW2
                ON VW2.videoId = V.id AND MONTH(VW2.date) = MONTH(CURDATE() - INTERVAL 1 MONTH)
             LEFT JOIN view VW3
                ON VW3.videoId = V.id AND MONTH(VW3.date) = MONTH(CURDATE() - INTERVAL 2 MONTH)
             LEFT JOIN view VW4
                ON VW4.videoId = V.id AND MONTH(VW4.date) = MONTH(CURDATE() - INTERVAL 3 MONTH)
             LEFT JOIN view VW5
                ON VW5.videoId = V.id AND MONTH(VW5.date) = MONTH(CURDATE() - INTERVAL 4 MONTH)
             LEFT JOIN view VW6
                ON VW6.videoId = V.id AND MONTH(VW6.date) = MONTH(CURDATE() - INTERVAL 5 MONTH)
             WHERE U.id = ? GROUP BY U.id`, [userId], (err, res) => {
    if (err) { return reject(err); } 
    if (res.length == 0) { return reject(); }
    return resolve(res);
  });
});
}



module.exports = User;
