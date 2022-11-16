var express = require('express');
var router = express.Router();
const { check } = require('express-validator');
const { validateInput } = require('../middleware/validate-input');
const db = require('../models/database');
const jwt = require('jsonwebtoken');

router.post('/login',[
  check('username', 'Username is required').not().isEmpty(),
  check('password', 'Password is required').not().isEmpty(),
  validateInput
], (req, res = response) => {
  const { username, password } = req.body;
  db.User.auth(username,password).then(rows => {
    const user = rows[0];
    const userToken = { id: user.id , email: user.email };
    const token = jwt.sign(userToken, 'ninja', {expiresIn: '5y'});
    res.json({ token: token });
  }).catch(e => {
    return res.status(400).json({ msg: e });
  });
});


router.post('/register',[
  check('username', 'Username is required').not().isEmpty(),
  check('email', 'Email not valid').not().isEmpty().isEmail(),
  check('password', 'Password is required').not().isEmpty(),
  validateInput
], (req, res = response) => {
  if(!/^[a-z0-9]+([_]{0,1}[a-z0-9]+)*$/i.test(req.body.username) || req.body.username.length < 3 || req.body.username.length > 18) {
    return res.status(400).json({ msg: "USERNAME" });
  }
  if(req.body.password.length < 6 || req.body.password.length > 18) {
    return res.status(400).json({ msg: "PASSWORD" });
  }
  db.User.register(req.body).then(() => {
    return res.json({ msg: "OK"});
  }).catch(e => {
    let error_message = "";
    let sqlerror = e.sqlMessage;
    if(sqlerror.includes("email_UNIQUE")) {
      error_message = "Email already exists";
    }else if(sqlerror.includes("username_UNIQUE")) {
      error_message = "Username already exists";
    }else{
      error_message = "Unknown error, try again later";
    }
    return res.status(400).json({ msg: error_message });
  });
});


module.exports = router;