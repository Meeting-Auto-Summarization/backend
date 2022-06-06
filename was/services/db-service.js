const path = require('path');
const User = require('../schemas/user');
const Meeting = require('../schemas/meeting');
const Script = require('../schemas/script');
const Report = require('../schemas/report');

exports.createMeeting = async (title, id, code, capacity) => { //meeting 생성
    try {
        const meeting = await Meeting.create({
            title: title,
            members: [id],
            code: code,
            hostId: id,
            capacity: capacity,
            visited: id
        });
        return meeting;
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

exports.createScript = async (meetingId) => {//스크립트 생성
    try {
        await Script.create({ //스크립트 document생성
            meetingId: meetingId,
        });

    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

exports.createReport = async (meetingId) => {//요약본 생성
    try {
        await Report.create({//요약본 document생성
            meetingId: meetingId,
        });

    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

exports.getMeetingByCode = async (code) => {//code를 통해 미팅정보 가져옴
    try {
        const meeting = await Meeting.findOne({ code: code });
        return meeting;
    } catch (err) {
        console.log(err);
        return err;
    }
}

//joinMeeting
exports.updateMeetingByCode = async (code, meetingInfo) => {
    try {
        await Meeting.findOneAndUpdate({ code: code }, meetingInfo);
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

//deleteMeeting
exports.deleteMeeting = async (meetingId) => {
    try {
        await Meeting.findByIdAndDelete(meetingId);
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

exports.deleteScript = async (meetingId) => {
    try {
        await Script.deleteOne(meetingId);
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

exports.deleteReport = async (meetingId) => {
    try {
        await Report.deleteOne(meetingId);
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

//deleteAccount
exports.deleteUser = async (userId) => {
    try {
        await User.findByIdAndDelete(userId);
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

//getIsHost
//getCurrentMeetingTitle
//getCurrentMeeting
exports.findCurrentMeeting = async (currentMeetingId) => {
    try {
        const meeting = await Meeting.findOne({ _id: currentMeetingId });
        return meeting;
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

//getCurrentMeetingScript
exports.findCurrentMeetingScript = async (currentMeetingId) => {
    try {
        const script = await Script.findOne({ meetingId: currentMeetingId });
        return script;
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

//postSubmitMeeting
exports.updateSubmitMeeting = async (currentMeetingId, time) => {
    try {
        await Meeting.findOneAndUpdate(
            { _id: currentMeetingId },
            { time: time, ongoing: false }
        );
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

exports.updateSubmitScript = async (currentMeetingId, text) => {
    try {
        await Script.findOneAndUpdate(
            { meetingId: currentMeetingId },
            { text: text }
        );
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

//getIsMeeting은 controller에서 처리
//exports.getIsMeeting = async () => {
//}

//setIsMeetingAllFalse
exports.updateIsMeetingAllFalse = async (currentMeetingId) => {
    const filter = { currentMeetingId: currentMeetingId };
    const update = { $set: { isMeeting: false } };
    try {
        await User.updateMany(filter, update);
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

exports.findOngoingMeeting = async () => {
    try {
        const ongoingMeeting = await Meeting.find({ ongoing: true });
        return ongoingMeeting;
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

//getMeetingResult
//getMeetingList
exports.findMeeting = async (meetingId) => {
    try {
        const meeting = await Meeting.findById(meetingId);
        return meeting;
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

exports.findScript = async (meetingId) => {
    try {
        const script = await Script.findOne({ meetingId: meetingId });
        return script;
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

exports.findReport = async (meetingId) => {
    try {
        const report = await Report.findOne({ meetingId: meetingId });
        return report;
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

exports.findUser = async (userId) => {
    try {
        const user = await User.findById(userId);
        return user;
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

//postSaveScripts
//postMeetingResult
exports.updateScript = async (meetingId, script) => {
    try {
        await Script.findOneAndUpdate(
            { meetingId: meetingId },
            { text: script }
        );
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

exports.updateReport = async (meetingId, report) => {
    try {
        await Report.findOneAndUpdate(
            { meetingId: meetingId },
            { report: report }
        );

    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

//exitMeeting
exports.updateMeetingInfo = async (meetingId, meetingInfo) => {
    try {
        await Meeting.findByIdAndUpdate(meetingId, meetingInfo);
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}

//setIsMeetingFalse
//changeUserInfo
exports.updateUserInfo = async (userId, userInfo) => {
    try {
        await User.findByIdAndUpdate(userId, userInfo);
    } catch (err) {
        console.error(err);
        throw Error(err);
    }
}