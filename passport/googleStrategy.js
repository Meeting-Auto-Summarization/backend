const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;

const User = require('../schemas/user');

module.exports = () => {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'https://ec2-3-38-49-118.ap-northeast-2.compute.amazonaws.com:3001/auth/google/callback',
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
                    firstName:profile.name.givenName,
                    lastName:profile.name.familyName,
                    avatar:profile.photos[0].value,
                    email:profile.email,
                });
                done(null, newUser);
            }
        } catch (error) {
            console.error(error);
            done(error);
        }
    }));
};