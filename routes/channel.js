var express = require('express');
var router = express.Router();
const db = require('../models/database');
const passport = require('passport');
var path = require('path');
const { check } = require('express-validator');
const { validateInput } = require('../middleware/validate-input');
const bcrypt = require('bcryptjs');
var fs = require('fs');

router.get('/totalviews/:id', function(req, res) {
  const { id } = req.params;
  db.User.totalViews(id).then(rows => {
      res.json({ data: rows });
    }).catch(e => {
      return res.status(400).json({ msg: "" });
  });
});

router.post("/updateprofile", passport.authenticate('jwt', { session: false }), async (req, res) => {
  const userId = req.user.id;
  const { about } = req.body;
  db.User.updateProfile(userId, about).then(() => {
      res.json({ status: "UPDATED" });
  }).catch(e => {
      return res.status(400).json({ msg: "" });
  });
});

router.post("/settings", passport.authenticate('jwt', { session: false }), async (req, res) => {
  const userId = req.user.id;
  db.User.updateSettings(userId, req.body).then(() => {
      res.json({ status: "UPDATED" });
  }).catch(e => {
      return res.status(400).json({ msg: "" });
  });
});

router.get('/mysettings',passport.authenticate('jwt', { session: false }), function(req, res) {
  const userId = req.user.id;
  db.User.notiSettings(userId).then(rows => {
      res.json({ data: rows });
  }).catch(e => {
      return res.status(400).json({ msg: "" });
  });
});

// ,passport.authenticate('jwt', { session: false })
router.get('/subscriptions/:id/:page', function(req, res) {
  const { id, page } = req.params;
  db.User.subscriptions(id, page).then(rows => {
      res.json({ data: rows });
    }).catch(e => {
      return res.status(400).json({ msg: "" });
  });
});

router.post('/notifications/view',passport.authenticate('jwt', { session: false }), function(req, res) {
  const userId = req.user.id;
  db.Notification.view(userId).then(() => {
    res.status(200).send({ status: "VIEWED" });
  }).catch(() => {
    return res.status(400).json({ msg: "" });
  });
});

router.get('/notifications/:page',passport.authenticate('jwt', { session: false }), function(req, res) {
  const userId = req.user.id;
  const { page } = req.params;

  db.Notification.fetch(userId, page).then(rows => {
    db.Notification.fetch(userId).then(count => {
      res.json({ data: rows, count: count.length });
   }).catch(e => {
      return res.status(400).json({ msg: "" });
   });
  }).catch(e => {
      return res.status(400).json({ msg: "" });
  });
});

router.post("/details",[
  check('email', 'Email not valid').not().isEmpty().isEmail(),
  validateInput
], passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { email, newPassword, password } = req.body;
  let userPassword =  req.user.password;

  if(bcrypt.compareSync(password, userPassword)) {
  if(newPassword != "") userPassword = await bcrypt.hash(newPassword, 10);
  db.User.updateDetails(req.user.id, email, userPassword).then(() => {
    res.status(200).send({ status: "UPDATED" });
  }).catch(e => {
    return res.status(400).json({ msg: "" });
  });
  }else{
    return res.status(400).json({ msg: "Current password incorrect" });
  }
});

router.get('/mydetails',passport.authenticate('jwt', { session: false }), function(req, res) {
  const userId = req.user.id;
  if(userId) {
    db.User.details(userId).then(rows => {
        res.json({ data: rows });
    }).catch(e => {
        return res.status(400).json({ msg: e });
    });
  }else{
    return res.status(400).json({ msg: "AUTH_FAIL" });
  }
});

router.get('/mysubscriptions/:page',passport.authenticate('jwt', { session: false }), function(req, res) {
    const userId = req.user.id;
    const { page } = req.params;
    db.User.subscriptions(userId, page).then(rows => { 
        res.json({ data: rows });
      }).catch(e => {
        return res.status(400).json({ msg: "" });
    });
});

router.post("/picture", passport.authenticate('jwt', { session: false }), (req, res) => {
    if(req.files) { 
      const newpath = "./public/user_thumbnails/";
      const file = req.files.file;
      const filename = file.name;
      const ext = path.extname(filename);
      const userId = req.user.id;
  
      const allowedExt = [".jpg", ".jpeg", ".png", ".gif",".webp"];
      if(!allowedExt.includes(ext)) {
        res.status(404).send({ message: "Only images are allowed" });
        return;
      }

      db.User.details(userId).then(rows => {
        if(rows[0].picturePath) {
          fs.unlinkSync(`${newpath}`+rows[0].picturePath);
        }
        const picturePath = `profile_`+fileName()+ext;
        file.mv(`${newpath}`+picturePath, (err) => {
          if (err) {
            res.status(500).send({ message: "File Upload Fail" });
            return;
          }
          db.User.updatePicture(userId, picturePath).then(() => {
            res.status(200).send({ picturePath: picturePath });
          }).catch(e => {
            return res.status(400).json({ msg: "" });
          });
        });
      }).catch(e => {
        return res.status(400).json({ msg: "" });
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
  
router.get('/:id', function(req, res) {
    const userId = req.params.id;
    db.User.details(userId).then(rows => {
        rows[0].subscribeState = 0; // [ 0 - hide ]||[ 1 - show ]||[ 2 - already subscribed ]
        passport.authenticate('jwt', { session: false }, async function(err, user) {
            if (!err && user) {
                if(user.id != userId) {
                    rows[0].subscribeState = 1;
                    await db.User.isSubscribed(user.id, userId).then(() => {
                        rows[0].subscribeState = 2;
                    }).catch(e => {});
                }
            }
            return res.json({ data: rows });
        })(req, res);
      }).catch(e => {
        return res.status(400).json({ msg: "" });
    });
});

router.get('/liked/:id/:page', function(req, res, next) {
  const { id, page } = req.params;
  passport.authenticate('jwt', { session: false }, async function(err, user) {
    let userId = 0;
    if (!err && user) {
      userId = user.id;
    }
    db.Video.channelLiked(id,userId, page).then(rows => {
      res.json({ data: rows });
    }).catch(e => {
      return res.status(400).json({ msg: "" });
  });
})(req, res);
});

router.get('/uploaded/:id/:page', function(req, res, next) {
    const { id, page } = req.params;
    passport.authenticate('jwt', { session: false }, async function(err, user) {
      let userId = 0;
      if (!err && user) {
        userId = user.id;
      }
      db.Video.channel(id,userId, page).then(rows => {
        res.json({ data: rows });
      }).catch(e => {
        return res.status(400).json({ msg: "" });
    });
  })(req, res);
});

router.post('/subscribe', passport.authenticate('jwt', { session: false }), function(req, res) {
    const { subscribeTo } = req.body;
    const userId = req.user.id;
    db.User.subscribe(userId, subscribeTo).then(notiId => {
        res.json({ status: "SUBSCRIBED", notiId });
    }).catch(e => {
        return res.status(400).json({ msg: "" });
    });
});
  
router.post('/unsubscribe', passport.authenticate('jwt', { session: false }), function(req, res) {
    const { subscribeTo } = req.body;
    const userId = req.user.id;
    db.User.unsubscribe(userId, subscribeTo).then(() => {
        res.json({ status: "UNSUBSCRIBED" });
      }).catch(e => {
        return res.status(400).json({ msg: "" });
    });
});
  


module.exports = router;


