const isLogin = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(403).send(false);
    }
}

module.exports = isLogin