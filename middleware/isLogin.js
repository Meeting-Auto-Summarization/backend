const isLogin = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.send(false);
    }
}

module.exports = isLogin