//const DBService = require('../services/db-service');
const path = require('path');
const User = require('../schemas/user');
const Meeting = require('../schemas/meeting');
const Script = require('../schemas/script');
const Report = require('../schemas/report');

//회의 생성
exports.postCreateMeeting = async (req, res, next) => {
    try {
        let flag = false;
        const ongoingMeeting = await Meeting.find({ ongoing: true });
        let code = '';

        while (!flag) {
            var i;
            code = Math.random().toString(36).substr(2, 6);

            for (i = 0; i < ongoingMeeting.length; i++) {
                if (ongoingMeeting[i].code === code) {
                    break;
                }
            }

            if (i == ongoingMeeting.length) {
                flag = true
            }

            console.log('생설 실패');
        }

        const meeting = await Meeting.create({
            title: req.body.title,
            members: [],
            code: code,
            hostId: req.user._id,
            capacity: req.body.capacity,
        });
        await Script.create({ //스크립트 document생성
            meetingId: meeting._id,
        });
        await Report.create({//요약본 document생성
            meetingId: meeting._id,
        });
        await User.findOneAndUpdate({//호스트의 참여회의 목록에 회의 id 추가, 현재 진행중인 미팅 id 저장
            id: req.user.id,
        }, {
            $push: { meetings: meeting._id },
            currentMeetingId: meeting._id,
            $set: { isMeeting: true },
        });
        await Meeting.findByIdAndUpdate(//회의 참여자 목록에 호스트 id추가
            meeting._id,
            { $push: { members: req.user._id } });
        res.send(code);
    } catch (err) {
        console.error(err);
        next(err);
    }
}

//회의 참여
exports.joinMeeting = async (req, res, next) => {
    //코드에 맞는 회의가 있으면 현재사용자의 currentMeeting에 push하는 작업한 후 true 반환
    try {
        const meeting = await Meeting.findOne({ code: req.params.code });
        if (!meeting || !meeting.ongoing) {
            res.send(false);
        } else {
            try {
                await User.findOneAndUpdate({
                    id: req.user.id,
                }, {
                    $push: { meetings: meeting._id },
                    currentMeetingId: meeting._id,
                    $set: { isMeeting: true },
                });
                await Meeting.findOneAndUpdate({
                    code: req.params.code,
                }, {
                    $push: { members: req.user._id },
                });
                res.send(true);
            } catch (error) {
                console.error(error);
                next(error);
            }
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
}

//회의 목록 가져오기
exports.getMeetingList = async (req, res, next) => {
    const userId = req.user._id;
    let meetingList = [];

    try {
        const user = await User.findById(userId);

        //회의 이름/날짜 DB에서 하나씩 받아옴
        for (let i = 0; i < user.meetings.length; i++) {
            const meeting = await Meeting.findById(user.meetings[i]);

            if (meeting.ongoing) {
                continue;
            }

            let membersName = [];

            //위에서 받아온 하나의 회의에 대한 참여자 목록 받아옴
            for (let j = 0; j < meeting.members.length; j++) {
                const mem = await User.findById(meeting.members[j]);
                membersName.push(mem.name);
            }

            meetingList.push({
                meeting: meeting,
                members: membersName
            });
        }

        res.json(meetingList);
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.postSTTCheckTrue = async (req, res, next) => {
    try {
        await Script.findOneAndUpdate({
            meetingId: req.params.meetingId
        }, {
            $set: { [`text.${req.body.loc}.isChecked`]: true },
        });
        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.postSTTCheckFalse = async (req, res, next) => {
    try {
        await Script.findOneAndUpdate({
            meetingId: req.params.meetingId
        }, {
            $set: { [`text.${req.body.loc}.isChecked`]: false },
        });
        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getScript = async (req, res, next) => {
    let scriptInfo = {
        title: '',
        date: '',
        scripts: {},
    };
    try {
        const meeting = await Meeting.findById(req.params.meetingId);
        const dt = meeting.date;
        scriptInfo.title = meeting.name;
        scriptInfo.date = dt.getFullYear() + "/" + (dt.getMonth()) + "/" + dt.getDate();
        const script = await Script.findOne({ meetingId: req.params.meetingId });
        scriptInfo.scripts = script;
        // for (let i = 0; i < script.text.length; i++) {
        //     scriptInfo.scripts.push({
        //         id: 
        //         isChecked: script.text[i].isChecked,//체크여부
        //         nick: script.text[i].nick,//발화자
        //         content: script.text[i].content,//내용
        //         time: script.text[i].time,//발화 시간
        //     });
        // }
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
            { meetingId: req.params.meetingId },
            { text: req.body.scripts }
        );
        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getReport = async (req, res, next) => {
    //res.sendFile(path.join(__dirname, '../index.html'));
    try {
        // const meeting = await Meeting.findById(req.params.meetingId);
        // console.log(meeting.name); //회의 이름
        // console.log(meeting.date); //회의 날짜
        const surmmarize = await Report.findOne({ meetingId: req.params.meetingId });
        console.log(surmmarize.report);
        res.json(surmmarize.report);
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.postReport = async (req, res, next) => {
    //res.sendFile(path.join(__dirname, '../index.html'));
    try {
        await Report.findOneAndUpdate(
            { meetingId: req.params.meetingId },
            { report: req.body.reports }
        );
        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.postNick = async (req, res, next) => {
    res.sendFile(path.join(__dirname, '../index.html'));
    try {
        await User.findByIdAndUpdate(req.user._id, { $set: { name: req.params.nick } });
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

exports.getCurrentMeeting = async (req, res, next) => {
    const meeting = await Meeting.findById(req.user.currentMeetingId);
    const members = meeting.members;
    const users = []

    for (var i = 0; i < members.length; i++) {
        const mem = await User.findById(members[i]);
        const name = mem.name;
        users.push(name);
    }

    try {
        res.send({
            meeting: meeting,
            members: users
        });
    } catch (err) {
        console.error(err);
        next(err);
    }
}

//현재 참여 중인 회의 Id
exports.getCurrentMeetingId = async (req, res, next) => {
    try {
        res.send(req.user.currentMeetingId);
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getCurrentMeetingCode = async (req, res, next) => {
    const currentMeetingId = req.user.currentMeetingId;
    const meeting = await Meeting.findById(currentMeetingId);
    const code = meeting.code;

    try {
        res.send(code);
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getCurrentMeetingMembers = async (req, res, next) => {
    const meeting = await Meeting.findById(req.user.currentMeetingId);
    const members = meeting.members;
    const users = []

    for (var i = 0; i < members.length; i++) {
        const mem = await User.findById(members[i]);
        const name = mem.name;
        users.push(name);
    }

    try {
        res.send(members);
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getCurrentMeetingScript = async (req, res, next) => {
    const currentMeetingId = req.user.currentMeetingId;
    const script = await Script.findOne({ meetingId: currentMeetingId });

    try {
        res.send(script.text);
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.postCurrentMeetingScript = async (req, res, next) => {
    const currentMeetingId = req.user.currentMeetingId;
    const script = req.body.script;
    const filter = { meetingId: currentMeetingId };
    const update = { text: script };

    try {
        await Script.findOneAndUpdate(filter, update);
        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getCurrentMeetingReport = async (req, res, next) => {
    const currentMeetingId = req.user.currentMeetingId;
    const report = await Report.findOne({ meetingId: currentMeetingId });

    try {
        res.send(report.report);
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.postCurrentMeetingReport = async (req, res, next) => {
    const currentMeetingId = req.user.currentMeetingId;
    const filter = { meetingId: currentMeetingId }
    const update = { report: req.body.report };

    try {
        await Report.findOneAndUpdate(filter, update);
        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getMeeting = async (req, res, next) => {
    try {
        const selectMeeting = await Meeting.findOne({ _id: req.params.meetingId });
        console.log(selectMeeting);
        res.send(selectMeeting);
    } catch (err) {
        next(err);
        res.send('success');
    }
}

exports.getIsHost = async (req, res, next) => {
    const meeting = await Meeting.findOne({ _id: req.user.currentMeetingId });
    const hostId = meeting.hostId;
    const userId = req.user._id;
    const isHost = (hostId == userId);

    try {
        res.send(isHost);
    } catch (err) {
        console.error(err);
        next(err)
    }
}

exports.deleteCurrentMeetingId = async (req, res, next) => {
    try {
        await User.findOneAndUpdate({
            id: req.user.id,
        }, {
            $unset: { currentMeetingId: "" }
        });
        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getIsMeeting = async (req, res, next) => {
    try {
        res.send(req.user.isMeeting);
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.setIsMeetingFalse = async (req, res, next) => {
    const update = { isMeeting: false };

    try {
        await User.findByIdAndUpdate(req.user._id, update);
        res.send('setIsMeetingFalseSuccess');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.setIsMeetingAllFalse = async (req, res, next) => {
    const filter = { currentMeetingId: req.user.currentMeetingId };
    const update = { $set: { isMeeting: false } };

    try {
        await User.updateMany(filter, update);
        res.send('setIsMeetingAllFalseSuccess');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getCurrentMeetingTitle = async (req, res, next) => {
    const currentMeetingId = req.user.currentMeetingId;
    const meeting = await Meeting.findOne({ _id: currentMeetingId });

    try {
        res.send(meeting.title);
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.postSubmitMeeting = async (req, res, next) => {
    const currentMeetingId = req.user.currentMeetingId;

    try {
        await Meeting.findOneAndUpdate(
            { _id: currentMeetingId },
            { time: req.body.time, ongoing: false }
        );
        // await Script.findOneAndUpdate(
        //     { meetingId: currentMeetingId },
        //     { text: req.body.text }
        // );
        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getCurrentMeetingDate = async (req, res, next) => {
    const currentMeetingId = req.user.currentMeetingId;
    const meeting = await Meeting.findById(currentMeetingId);

    try {
        res.send(meeting.date);
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.setScriptChecked = async (req, res, next) => {
    // const index = req.body.index;
    // const isChecked = req.body.isChecked;
    // try {
    //     const script = await Script.findOne({ meetingId: req.user.currentMeetingId });
    //     const text = script.text;
    //     text[index].isChecked = isChecked;

    //     await Script.findOneAndUpdate(
    //         { meetingId: req.user.currentMeetingId },
    //         { text: text }
    //     );

    //     res.send('success');
    // } catch (err) {
    //     console.error(err);
    //     next(err);
    // }
}
