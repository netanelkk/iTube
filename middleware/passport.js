var passport = require('passport');
const db = require('../models/database');


// Auth user details on existing token
var JwtStrategy = require('passport-jwt').Strategy, ExtractJwt = require('passport-jwt').ExtractJwt;
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = 'ninja';
passport.use(new JwtStrategy(opts, async function(jwt_payload, done) {
    db.User.authToken(jwt_payload.id, jwt_payload.email).then(rows => {
        return done(null, rows[0]);
    }).catch(() => {
        return done(null, "false");
        // return done(null, false, { message: e });
    });

}));

passport.serializeUser(function(id, done) {
  done(null, id);
});

passport.deserializeUser(function(id, done) {
    done(err, id);
});