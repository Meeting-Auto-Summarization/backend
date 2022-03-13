exports.getLoginStatus = (req, res) => {
    res.send('로그인 상태');
}

exports.getUserInfo = (req, res) => {
    res.send(req.user);
}

exports.getUserMeetingInfo = (req, res) => {
    const { currentMeetingId, name } = req.user;
    console.log(currentMeetingId, name);
    res.send({
        currentMeetingId: currentMeetingId,
        name: name,
    });
}
exports.getLogout = (req, res) => {
    req.logout();
    req.session.destroy();
    res.redirect('http://ec2-3-38-49-118.ap-northeast-2.compute.amazonaws.com:3000/');
}
exports.getGoogleLoginCallback = (req, res) => {
    res.redirect('http://ec2-3-38-49-118.ap-northeast-2.compute.amazonaws.com:3000/meeting-list');
}

