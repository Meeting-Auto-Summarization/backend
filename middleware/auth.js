const isLogin = (req, res) => {
    if(req.isAuthenticated()) return true;
    else return false;
}

module.exports = isLogin