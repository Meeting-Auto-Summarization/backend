const express = require('express');
const passport = require('passport');
const isLogin = require('../middleware/isLogin');
const router = express.Router();
const authController = require('../controllers/auth-controller')

router.get('/', isLogin, authController.getLoginStatus);//로그인 여부 확인
router.get('/user-info', isLogin, authController.getUserInfo);//user 정보 전체 가져옴

router.get('/meeting-info', isLogin, authController.getUserMeetingInfo);//meeting 참여에 필요한 user 정보들만 갖고옴

router.get('/google', passport.authenticate('google', { scope: ['openid', 'profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' },), authController.getGoogleLoginCallback);
router.get('/logout', isLogin, authController.getLogout);

module.exports = router;