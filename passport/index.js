const passport = require('passport');
//const local = require('./localStrategy');
const google = require('./googleStrategy');
const User = require('../schemas/user');

module.exports = () => {
    passport.serializeUser((user, done) => {
        done(null, user.id); // 세션에 user의 id만 저장
    });

    passport.deserializeUser((user_id, done) => {
        User.findOne({ id: user_id })
            .then(user => done(null, user)) //req.user 사용!
            .catch(err => done(err));
    });

    google();
};