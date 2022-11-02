const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const path = require(`path`);//내장모듈
const User = require('../schemas/user');
require(`dotenv`).config({ path: path.join(__dirname, `../credentials/.env`) })

module.exports = () => {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.CALLBACK_URL}/auth/google/callback`,
    }, async (accessToken, refreshToken, profile, done) => {
        console.log('google profile', profile);
        try {
            const exUser = await User.findOne({
                // where: { snsId: profile.id, provider: 'kakao' },
                id: profile.id
            });
            if (exUser) {
                done(null, exUser);
            } else {
                const newUser = await User.create({
                    //email: profile._json && profile._json.kakao_account_email,
                    id: profile.id,
                    name: profile.displayName,
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,
                    avatar: profile.photos[0].value,
                    email: profile.email,
                });
                done(null, newUser);
            }
        } catch (error) {
            console.error(error);
            done(error);
        }
    }));
};