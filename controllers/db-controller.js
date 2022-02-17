//const DBService = require('../services/db-service');
const path = require('path');
const User = require('../schemas/user');
const Meeting = require('../schemas/meeting');
const Script = require('../schemas/script');
const Surmmarize = require('../schemas/surmmarize');

//회의 생성
exports.postMeeting = async (req, res, next) => {
    try {
        const meeting = await Meeting.create({
            name: req.body.name,
            url: req.body.code,
        });
        await Script.create({
            name: meeting._id,
        });
        await Surmmarize.create({
            name: meeting._id,
        });
        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

//회의 참여
exports.postMeeting = async (req, res, next) => {
    try {
        await User.findOneAndUpdate({
            id: req.user.id,
        }, {
            $push: { meetings: req.params.meetingId },
        });
        await Meeting.findOneAndUpdate({
            code: req.params.code,
        }, {
            $push: { users: req.user._id },
        });
        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getMeetingList = async (req, res, next) => {
    const userId = req.user._id;
    let meetingInfo = [];
    try {
        const user = await User.findById(userId);
        //회의 이름/날짜 DB에서 하나씩 받아옴
        for (let i = 0; i < user.meetings.length; i++) {
            const meeting = await Meeting.findById(user.meetings[i]);
            const dt = meeting.date;
            meetingInfo.push({
                name: meeting.name,
                date: dt.getFullYear() + "/" + (dt.getMonth()) + "/" + dt.getDate(),
                participants: [],
            });
            //위에서 받아온 하나의 회의에 대한 참여자 목록 받아옴
            for (let j = 0; j < meeting.users.length; j++) {
                const participant = await User.findById(meeting.users[j]);
                meetingInfo[i].participants.push(participant.name);
            }
        }
        console.log(meetingInfo);
        res.json(meetingInfo);
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getScript = async (req, res, next) => {
    let scriptInfo = {
        meetingName: '',
        meetingDate: '',
        scripts: [],
    };
    try {
        const meeting = await Meeting.findById(req.params.meetingId);
        const dt = meeting.date;
        scriptInfo.meetingName = meeting.name;
        scriptInfo.meetingDate = dt.getFullYear() + "/" + (dt.getMonth()) + "/" + dt.getDate();
        const script = await Script.findOne({ name: req.params.meetingId });
        for (let i = 0; i < script.text.length; i++) {
            scriptInfo.scripts.push({
                participant: script.text[i].user,//발화자
                script: script.text[i].content,//내용
                isChecked: script.text[i].isChecked,//체크여부
            });
        }
        console.log(scriptInfo);
        res.json(scriptInfo);
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
        // const meeting = await Meeting.findById(req.params.meetingId);
        // console.log(meeting.name); //회의 이름
        // console.log(meeting.date); //회의 날짜
        const surmmarize = await Surmmarize.findOne({ name: req.params.meetingId });
        console.log(surmmarize.text);
        res.json(surmmarize.text);
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