//const DBService = require('../services/db-service');
const path = require('path');
const User = require('../schemas/user');
const Meeting = require('../schemas/meeting');
const Script = require('../schemas/script');
const Surmmarize = require('../schemas/surmmarize');

exports.getMeetingList = async (req, res, next) => {
    res.sendFile(path.join(__dirname, '../index.html'));
    const user = req.user._id;
    try {
        //const user = await User.findById(userId);
        for (let i = 0; i < user.meetings.length; i++) {
            const meeting = await Meeting.findById(user.meetings[i]);
            console.log(meeting.name); //회의 이름
            console.log(meeting.date); //회의 날짜
            for (let j = 0; j < meeting.users.length; j++) {
                const participant = await User.findById(meeting.users[j]);
                console.log(participant.name); //참여자 이름
            }
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getScript = async (req, res, next) => {
    res.sendFile(path.join(__dirname, '../index.html'));
    try {
        const meeting = await Meeting.findById(req.params.meetingId);
        console.log(meeting.name); //회의 이름
        console.log(meeting.date); //회의 날짜
        const script = await Script.findOne({ name: req.params.meetingId });
        for (let i = 0; i < script.text.length; i++) {
            const participant = await User.findById(script.text[i].user);
            console.log(participant.name); //참여자 이름
            console.log(script.text[i].content); //발화 내용
            console.log(script.text[i].isChecked); //체크 여부
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.postScript = async (req, res, next) => {
    res.sendFile(path.join(__dirname, '../index.html'));
    const deleteArray = [1];
    const updateArray = [{ index: 0, content: '안녕' }, { index: 2, content: '바이' }];
    try {
        const script = await Script.findOne({ name: req.params.meetingId });
        for (let i = 0; i < updateArray.length; i++) {

        }
        //for (let i = 0; i < deleteArray.length; i++) {
            // await Script.findOneAndUpdate(
            //     { name: req.params.meetingId },
            //     { text: 'hahaha' }
            // );
            script.deleteMany({})
        //}
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getSurmmarize = async (req, res, next) => {
    res.sendFile(path.join(__dirname, '../index.html'));
    try {
        const meeting = await Meeting.findById(req.params.meetingId);
        console.log(meeting.name); //회의 이름
        console.log(meeting.date); //회의 날짜
        const surmmarize = await Surmmarize.findOne({ name: req.params.meetingId });
        console.log(surmmarize.text);
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.postSurmmarize = async (req, res, next) => {
    res.sendFile(path.join(__dirname, '../index.html'));
    try {
        await Surmmarize.findOneAndUpdate(
            { name: req.params.meetingId },
            { text: 'hahaha' }
        );
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.postNickname = async (req, res, next) => {
    res.sendFile(path.join(__dirname, '../index.html'));
    try {
        await User.findByIdAndUpdate(req.user._id, { $set: { name: req.params.nickname } });
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.deleteAccount = async (req, res, next) => {
    res.sendFile(path.join(__dirname, '../index.html'));
    try {
        await User.findByIdAndDelete(req.user._id);
    } catch (err) {
        console.error(err);
        next(err);
    }
}