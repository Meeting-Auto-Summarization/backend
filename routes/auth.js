const express = require('express');
const passport = require('passport');
const isLogin = require('../middleware/isLogin');
const router = express.Router();

router.get('/', (req, res) => {//로그인 상태 확인
    if(isLogin(req,res)){
        console.log("로그인 상태");
        console.log(req.user)
        res.send(req.user);
    }else{
        console.log("로그인 X");
        res.send(false);
    }
})

router.get('/google', passport.authenticate('google', { scope: ['openid', 'profile','email'] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' },), 
(req, res) => {
    res.redirect('http://localhost:3000/meeting-list');
});

router.get('/logout',(req,res)=>{
    req.logout();
    req.session.destroy();
    res.redirect('http://localhost:3000/');
});

module.exports = router;