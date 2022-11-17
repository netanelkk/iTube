var express = require('express');
var router = express.Router();
const db = require('../models/database');
const passport = require('passport');
const { check } = require('express-validator');
const { validateInput } = require('../middleware/validate-input');
var path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const extractFrames = require('ffmpeg-extract-frames');
const { getVideoDurationInSeconds } = require('get-video-duration');
var fs = require('fs');

const video_thumbnails_path = './public/video_thumbnails/';
const videos_path = "./public/videos/";


router.get("/usersearch/:username", passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { username } = req.params;
  db.User.search(username, req.user.username).then(rows => {
    res.json({ data: rows });
  }).catch(e => {
    return res.status(400).json({ msg: "" });
  });
});


router.post("/commentdelete", passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { commentId } = req.body;
  db.Video.deleteComment(commentId, req.user.id).then(() => {
    res.status(200).send({ status: "DELETED" });
  }).catch(e => {
    return res.status(400).json({ msg: "" });
  });
});

router.post("/delete", passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { videoId } = req.body;
  db.Video.details(videoId).then(rows => {
      fs.unlinkSync(`${videos_path}`+rows[0].videoPath);
      fs.unlinkSync(`${video_thumbnails_path}`+rows[0].thumbnailPath);
    db.Video.delete(videoId, req.user.id).then(() => {
      res.status(200).send({ status: "DELETED" });
    }).catch(e => {
      return res.status(400).json({ msg: "" });
    });
  }).catch(e => {
    return res.status(400).json({ msg: "" });
  });
});

router.post("/updateprivate/:videoId", passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { password, privateChecked } = req.body;
  const { videoId } = req.params;
  if(privateChecked && password == "") {
    res.status(200).send({ status: "NOTCHANGED" });
  }else{
    db.Video.updatePrivate(videoId, req.user.id, password).then(() => {
      res.status(200).send({ status: "UPDATED" });
    }).catch(e => {
      return res.status(400).json({ msg: "" });
    });
  }

});

router.post("/updatetitle/:videoId",[
    check('title', 'Title is empty').not().isEmpty(),
    validateInput
  ], passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { title } = req.body;
    const { videoId } = req.params;
    db.Video.updateTitle(videoId, req.user.id, title).then(() => {
      res.status(200).send({ status: "UPDATED" });
    }).catch(e => {
      return res.status(400).json({ msg: "" });
    });
});
  
router.post("/upload",[
  check('title', 'Title is empty').not().isEmpty(),
  check('description', 'Description is empty').not().isEmpty(),
  validateInput
], passport.authenticate('jwt', { session: false }), (req, res) => {
  if(req.files) { 
    const file = req.files.file;
    const filename = file.name;
    const ext = path.extname(filename);

    const allowedExt = [".mp4", ".webm"];
    if(!allowedExt.includes(ext)) {
      res.status(400).send({ msg: "Only videos of mp4 or webm format are allowed" });
      return;
    }
    const videoUnique = `video_`+fileName();
    const videoPath = videoUnique + ext;
    const fullVideoPath = `${videos_path}`+videoPath;
    file.mv(fullVideoPath, (err) => {
      if (err) {
        res.status(400).send({ msg: "File Upload Fail" });
        return;
      }
      getVideoDurationInSeconds(fullVideoPath).then(async (duration) => {
        await extractFrames({
          input: fullVideoPath,
          output: video_thumbnails_path + videoUnique + ".jpg",
          offsets: [(duration/2)*1000]
        });
        const video = { title: req.body.title, description: req.body.description, duration: Math.floor(duration),
                        videoPath: videoPath, thumbnailPath: videoUnique + ".jpg", publisher: req.user.id,
                        password: req.body.password }
        await db.Video.add(video).then(result => {
           return res.status(200).send({ id: result[0], notiId: result[1], thumbnailPath: videoUnique + ".jpg" });
        }).catch(e => {
          return res.status(400).json({ msg: "" });
        });
      }).catch((e) => {
        return res.status(400).json({ msg: e });
      });
    });
  }
});

function fileName() {
  var result           = '';
  var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < 10; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
 }
 return result;
}

router.post('/like', passport.authenticate('jwt', { session: false }), function(req, res) {
  const { videoId } = req.body;
  const userId = req.user.id;

  db.Video.didLike(videoId, userId).then(result => {
    if(result[0].totalRows) { // already liked
      db.Video.removeLike(videoId, userId).then(() => {
        res.json({ status: "LIKEREMOVED" });
      }).catch(e => {
        return res.status(400).json({ msg: "" });
    });
    }else{ // not liked yet
      db.Video.addLike(videoId, userId).then(result => {
        res.json({ status: "LIKEADDED", notiId: result });
      }).catch(e => {
        return res.status(400).json({ msg: "" });
    });
    }
  }).catch(e => {
    return res.status(400).json({ msg: "" });
  });


});


router.post('/:id', function(req, res) {
    const { password } = req.body; 
    const id = req.params.id;
    const userIp = ipFormat(req.headers['x-forwarded-for'] || req.socket.remoteAddress);
    db.Video.fetch(id, password).then(rows => {
      passport.authenticate('jwt', { session: false }, function(err, user) {
        if (!err && user) {
          db.Video.addView(id, userIp, user.id);
          db.Video.didLike(id,user.id).then(result => {
            rows[0].didLike = result[0].totalRows;
            res.json({ data: rows });
          }).catch(e => {
            return res.status(400).json({ msg: "" });
          });
        }else{
          db.Video.addView(id, userIp);
          res.json({ data: rows });
        }
      })(req, res);
      }).catch(e => {
        return res.status(400).json({ msg: e });
    });
});



router.get('/:id/comments/:page', function(req, res) {
  const { id, page } = req.params;
  db.Video.fetchComments(id, Number(page)).then(async (rows) => {
    try {
      const totalTags = await tagmap(rows);
      db.Video.countComments(id).then(count => {
        res.json({ data: rows, count, tags: totalTags });
      }).catch(e => {
        return res.status(400).json({ msg: "" });
      });
    } catch(e) {
      return res.status(400).json({ msg: "" });
    }
  }).catch(e => {
      return res.status(400).json({ msg: "" });
  });
});

function tags(str) {
  const words = str.split(" ");
  const taglist = [];
  for(let i = 0; i < words.length; i++) {
    const alltags = words[i].split("@");
    for(let j = 0; j < alltags.length; j++) {
      taglist.push(alltags[j].replace(/\s/g, ''));
    }
  }
  return taglist;
}

async function tagmap(rows) {
    let totalTags = {};
    var promises = [];
    var i = 0;
    for (const row of rows) {
      for(const tag of tags(row.content)) {
        if(!(tag in totalTags)) {
          promises.push(db.User.searchTag(tag));
          totalTags[tag] = 0;
        }
      }
    }
    return Promise.all(promises).then(results => {
      for(var tag in totalTags) {
        if(results[i] === 0) {
          delete totalTags[tag];
        }else{
          totalTags[tag] = results[i][0].id;
        }
        i++;
      }
      return totalTags;
    });
}

function tagNotification(tags, videoId, myId) {
  return new Promise(async (resolve,reject) => {
    const notiList = [];
    for(var tag in tags) {
      await db.Notification.allowed(tags[tag], db.Notification.NotiType.MENTION).then(async (allowed) => {
        if(allowed) {
        const notification = {
          userId: tags[tag],
          from: myId,
          videoId: videoId,
          type: db.Notification.NotiType.MENTION
        }
        await db.Notification.new(notification).then(result => {
          notiList.push(result.insertId);
        }).catch((e) => {
          return reject(e);
        }); 
      }
    }).catch(() => {});
    }
    return resolve(notiList);
  });
}

router.post('/:id/comments',[
  check('content', 'Comment is empty').not().isEmpty(),
  validateInput
], passport.authenticate('jwt', { session: false }), (req, res = response) => {
  const videoId = req.params.id;
  const userId = req.user.id;
  let content = req.body.content.replace(/@{2,}/g, "@");
  db.Video.addComment(userId, videoId, content).then(result => {
    db.Video.fetchComment(result[0]).then(async (rows) => {
      const totalTags = await tagmap([{ content }]);
      tagNotification(totalTags, videoId, userId).then(notiList => {
        notiList.unshift(result[1]);
        res.json({ data: rows, tags: totalTags, notiId: notiList });
      }).catch(e => {
        return res.status(400).json({ msg: "" });
      });
    }).catch(e => {
     return res.status(400).json({ msg: "" });
    });
  }).catch(e => {
      return res.status(400).json({ msg: "" });
  });
});

router.get('/:id/alsolike', function(req, res, next) {
  const videoId = req.params.id;
  db.Video.alsoLike(videoId).then(rows => {
      res.json({ data: rows });
    }).catch(e => {
      return res.status(400).json({ msg: "" });
  });
});



function ipFormat(ip) {
    return ((ip.substr(0, 7) == "::ffff:") ? ip.substr(7) : ip);
}

module.exports = router;


