var express = require('express');
var router = express.Router();
const db = require('../models/database');
const passport = require('passport');

router.get('/', function(req, res, next) {
    db.Video.fetchNew().then(rows => {
        res.json({ data: rows });
      }).catch(e => {
        return res.status(400).json({ msg: "" });
    });
});

router.get('/popular', function(req, res, next) {
  db.Video.popularNow().then(rows => {
      res.json({ data: rows });
    }).catch(e => {
      return res.status(400).json({ msg: "" });
  });
});

router.get('/trending', function(req, res, next) {
  db.Video.trending(30).then(rows => {
      res.json({ data: rows });
    }).catch(e => {
      return res.status(400).json({ msg: "" });
  });
});

router.get('/subscriptions',passport.authenticate('jwt', { session: false }), function(req, res, next) {
  const userId = req.user.id;
  db.Video.subscriptions(userId).then(rows => {
      res.json({ data: rows });
    }).catch(e => {
      return res.status(400).json({ msg: "" });
  });
});

router.get('/history/:page',passport.authenticate('jwt', { session: false }), function(req, res, next) {
  const userId = req.user.id;
  const page = req.params.page;
  db.Video.history(userId, page).then(rows => {
    db.Video.history(userId, -1).then(count => {
      res.json({ data: rows, count: count.length });
    }).catch(e => {
      return res.status(400).json({ msg: "" });
    });
  }).catch(e => {
      return res.status(400).json({ msg: "" });
  });
});

router.get('/likes/:page',passport.authenticate('jwt', { session: false }), function(req, res, next) {
  const userId = req.user.id;
  const page = req.params.page;
  db.Video.likes(userId, page).then(rows => {
    db.Video.likes(userId, -1).then(count => {
      res.json({ data: rows, count: count.length });
   }).catch(e => {
      return res.status(400).json({ msg: "" });
   });
  }).catch(e => {
      return res.status(400).json({ msg: "" });
  });
});



module.exports = router;


