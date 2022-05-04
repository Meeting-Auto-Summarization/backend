//const DBService = require('../services/db-service');
const path = require('path');
const User = require('../schemas/user');
const Meeting = require('../schemas/meeting');
const Script = require('../schemas/script');
const Report = require('../schemas/report');
var fs = require('fs').promises;

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
            { $push: { members: req.user._id, visited: req.user._id } });
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
                    $addToSet: { meetings: meeting._id },
                    currentMeetingId: meeting._id,
                    $set: { isMeeting: true },
                });

                await Meeting.findOneAndUpdate(
                    { code: req.params.code },
                    { $addToSet: { members: req.user._id, visited: req.user._id } }
                );

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

exports.exitMeeting = async (req, res, next) => {
    try {
        await Meeting.findByIdAndUpdate(
            req.user.currentMeetingId,
            { $pull: { members: req.user._id } }
        )

        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.deleteMeeting = async (req, res, next) => {
    const deleted = req.body.deleted;
    const userId = req.user._id;
    
    try {
        const user = await User.findById(userId);
        const meetings = user.meetings;
        
        for (let i = 0; i < deleted.length; i++) {
            meetings.splice(meetings.indexOf(deleted[i]), 1);
            await User.findByIdAndUpdate(userId, { meetings: meetings });
            await Meeting.findByIdAndUpdate(deleted[i], { $pull: { members: userId } });
            
            const meeting = await Meeting.findById(deleted[i]);
            if (meeting.visited.length < 1) {
                await Meeting.findByIdAndDelete(deleted[i]);
                await Script.deleteOne({ meetingId: deleted[i] });
                await Report.deleteOne({ meetingId: deleted[i] });
            }
        }

        res.send('success');
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
            for (let j = 0; j < meeting.visited.length; j++) {
                const mem = await User.findById(meeting.visited[j]);
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

exports.changeUserInfo = async (req, res, next) => {
    const userId = req.user._id;
    const userInfo = req.body.values;

    try {
        await User.findByIdAndUpdate(
            userId,
            {
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                email: userInfo.email,
                name: userInfo.name,
            }
        );
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
        await Script.findOneAndUpdate(
            { meetingId: currentMeetingId },
            { text: req.body.text }
        );
        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getMeetingResult = async (req, res, next) => {
    const meetingId = req.params.meetingId;

    try {
        const meeting = await Meeting.findById(meetingId);
        const script = await Script.findOne({ meetingId: meetingId });
        const report = await Report.findOne({ meetingId: meetingId });

        const members = meeting.visited;
        const users = []

        for (var i = 0; i < members.length; i++) {
            const mem = await User.findById(members[i]);
            const name = mem.name;
            users.push(name);
        }

        res.send({
            meeting: meeting,
            members: users,
            script: script.text,
            report: report.report
        });
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.postMeetingResult = async (req, res, next) => {
    const meetingId = req.body.meetingId;
    const script = req.body.script;
    const report = req.body.report;

    try {
        await Script.findOneAndUpdate(
            { meetingId: meetingId },
            { text: script }
        );
        await Report.findOneAndUpdate(
            { meetingId: meetingId },
            { report: report }
        );

        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}
