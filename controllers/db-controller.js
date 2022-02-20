//const DBService = require('../services/db-service');
const path = require('path');
const User = require('../schemas/user');
const Meeting = require('../schemas/meeting');
const Script = require('../schemas/script');
const Surmmarize = require('../schemas/surmmarize');

//회의 생성
exports.postCreateMeeting = async (req, res, next) => {
    try {
        const meeting = await Meeting.create({
            name: req.body.name,
            code: req.body.code,
            host: req.body.hostNick,
        });
        await Script.create({ //스크립트 document생성
            name: meeting._id,
        });
        await Surmmarize.create({//요약본 document생성
            name: meeting._id,
        });
        await User.findOneAndUpdate({//호스트의 참여회의 목록에 회의 id 추가
            id: req.user.id,
        }, {
            $push: { meetings: req.body.meetingId },
        });
        await Meeting.findOneAndUpdate({//회의 참여자 목록에 호스트 id추가
            code: req.body.code,
        }, {
            $push: { users: req.user._id },
        });
        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

//회의 참여
exports.postJoinMeeting = async (req, res, next) => {
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
        //const user = await User.findById('620df64c8e6f202cdc1a97eb');
        const user = await User.findById(userId);
        //회의 이름/날짜 DB에서 하나씩 받아옴
        for (let i = 0; i < user.meetings.length; i++) {
            const meeting = await Meeting.findById(user.meetings[i]);
            const dt = meeting.date;
            meetingInfo.push({
                title: meeting.name,
                date: dt.getFullYear() + "/" + (dt.getMonth()) + "/" + dt.getDate(),
                members: [],
            });
            //위에서 받아온 하나의 회의에 대한 참여자 목록 받아옴
            for (let j = 0; j < meeting.users.length; j++) {
                const participant = await User.findById(meeting.users[j]);
                console.log(participant.name);
                meetingInfo[i].members.push(participant.name);
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
        title: '',
        date: '',
        scripts: [],
    };
    try {
        const meeting = await Meeting.findById(req.params.meetingId);
        const dt = meeting.date;
        scriptInfo.title = meeting.name;
        scriptInfo.date = dt.getFullYear() + "/" + (dt.getMonth()) + "/" + dt.getDate();
        const script = await Script.findOne({ name: req.params.meetingId });
        for (let i = 0; i < script.text.length; i++) {
            scriptInfo.scripts.push({
                isChecked: script.text[i].isChecked,//체크여부
                nick: script.text[i].user,//발화자
                content: script.text[i].content,//내용
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
    try {
        const script = await Script.findOneAndUpdate(
            { name: req.params.meetingId },
            { text: req.body.scripts }
        );
        res.send('success');
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
    //res.sendFile(path.join(__dirname, '../index.html'));
    try {
        await Surmmarize.findOneAndUpdate(
            { name: req.params.meetingId },
            { text: req.body.content }
        );
        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.postNickname = async (req, res, next) => {
    res.sendFile(path.join(__dirname, '../index.html'));
    try {
        await User.findByIdAndUpdate(req.user._id, { $set: { name: req.params.nickname } });
        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.deleteAccount = async (req, res, next) => {
    res.sendFile(path.join(__dirname, '../index.html'));
    try {
        await User.findByIdAndDelete(req.user._id);
        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}