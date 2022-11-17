var express = require('express');
var router = express.Router();
const db = require('../models/database');
const { check } = require('express-validator');
const { validateInput } = require('../middleware/validate-input');

router.post('/',[
  check('query', 'Search input is empty').not().isEmpty(),
  validateInput
], (req, res = response) => {
  const { query, page, orderby } = req.body;
  db.Video.search(query, page, orderby).then(rows => {
    db.Video.search(query, 1, '', -1).then(count => {
      return res.json({ data: rows, count: count.length });
    }).catch(e => {
      return res.status(400).json({ msg: "" });
    });
  }).catch(e => {
    return res.status(400).json({ msg: "" });
  });
});

router.post('/suggestion',[
  check('query', 'Search input is empty').not().isEmpty(),
  validateInput
], (req, res = response) => {
  const { query } = req.body;
  db.Video.search(query, 1, '', 4).then(rows => {
    return res.json({ data: rows });
  }).catch(e => {
    return res.status(400).json({ msg: "" });
  });
});

module.exports = router;


