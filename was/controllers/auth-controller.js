const path = require(`path`);//내장모듈
require(`dotenv`).config({ path: path.join(__dirname, `../credentials/.env`) })

exports.getLoginStatus = (req, res) => {
    res.send('로그인 상태');
}

exports.getUserInfo = (req, res) => {
    res.send(req.user);
}

exports.getUserMeetingInfo = (req, res) => {
    const { currentMeetingId, name, currentMeetingTime } = req.user;
    res.send({
        currentMeetingId: currentMeetingId,
        name: name,
        currentMeetingTime: currentMeetingTime
    });
}
exports.getLogout = (req, res) => {
    req.logout();
    req.session.destroy();
    res.redirect(`${process.env.CLIENT_URL}/`);
}
exports.getGoogleLoginCallback = (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/meeting-list`);
}