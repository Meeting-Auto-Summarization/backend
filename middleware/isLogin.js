const isLogin = (req, res) => {
    console.log("인증상태");
    console.log(req.isAuthenticated())
    if(req.isAuthenticated()) return true;
    else return false;
}

module.exports = isLogin