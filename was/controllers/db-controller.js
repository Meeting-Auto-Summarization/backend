const DBService = require('../services/db-service');
var fs = require('fs').promises;

exports.exitMeeting = async (req, res, next) => {
    const update = { isMeeting: false };
    try {
        await DBService.updateMeetingInfo(req.user.currentMeetingId, { $pull: { members: req.user._id } });
        await DBService.updateUserInfo(req.user._id, update);
        res.send('exitMeeting success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.endMeeting = async (req, res, next) => {
    try {
        await DBService.updateScript(req.roomName, req.scripts);

        await DBService.updateIsMeetingAllFalse(req.user.currentMeetingId);

        await DBService.updateSubmitMeeting(req.user.currentMeetingId, req.body.time);
        await DBService.updateSubmitScript(req.user.currentMeetingId, req.body.text);
        res.send('endMeeting success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.postCreateMeeting = async (req, res, next) => {
    try {
        let flag = false;
        const ongoingMeeting = await DBService.findOngoingMeeting();
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
                flag = true;
            }
        }

        const meeting = await DBService.createMeeting(req.body.title, req.user._id, code, req.body.capacity);
        await DBService.createScript(meeting._id)//스크립트 document생성
        await DBService.createReport(meeting._id)//요약본 document생성

        await DBService.updateUserInfo(//호스트의 참여회의 목록에 회의 id 추가, 현재 진행중인 미팅 id 저장
            req.user._id,
            {
                $push: { meetings: meeting._id },
                currentMeetingId: meeting._id,
                currentMeetingTime: meeting.date,
                $set: { isMeeting: true },
            });

        console.log('생설 실패');


        res.send(code);

    } catch (err) {
        console.error(err);
        next(err);
    }
}


exports.joinMeeting = async (req, res, next) => {
    try {
        const meeting = await DBService.getMeetingByCode(req.params.code);
        if (!meeting || !meeting.ongoing) {
            res.send(false);
        } else {
            try {

                await DBService.updateUserInfo(
                    req.user._id,
                    {
                        $addToSet: { meetings: meeting._id },
                        currentMeetingId: meeting._id,
                        meetingTime: meeting.date,
                        $set: { isMeeting: true },
                    });

                await DBService.updateMeetingByCode(
                    req.params.code,
                    { $addToSet: { members: req.user._id, visited: req.user._id } }
                );

                res.send(true);
            } catch (error) {
                console.error(err);
                throw Error(err);
            }
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.deleteMeeting = async (req, res, next) => {
    try {
        const user = await DBService.findUser(req.user._id);
        const meetings = user.meetings;

        for (let i = 0; i < req.body.deleted.length; i++) {
            meetings.splice(meetings.indexOf(req.body.deleted[i]), 1);
            await DBService.updateUserInfo(req.user._id, { meetings: meetings });
            await DBService.updateMeetingInfo(req.body.deleted[i], { $pull: { members: req.user._id } });

            const meeting = await DBService.findMeeting(req.body.deleted[i]);
            if (meeting.visited.length < 1) {
                await DBService.deleteMeeting(req.body.deleted[i]);
                await DBService.deleteScript({ meetingId: deleted[i] });
                await DBService.deleteReport({ meetingId: deleted[i] });
            }
        }
        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getMeetingList = async (req, res, next) => {
    let meetingList = [];
    try {
        let user = await DBService.findUser(req.user._id);

        for (let i = 0; i < user.meetings.length; i++) {
            const meeting = await DBService.findMeeting(user.meetings[i]);

            if (meeting.ongoing) {
                continue;
            }

            let membersName = [];

            //위에서 받아온 하나의 회의에 대한 참여자 목록 받아옴
            for (let j = 0; j < meeting.visited.length; j++) {
                const mem = await DBService.findUser(meeting.visited[j]);
                console.log(mem)
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
    try {
        const userInfo = { firstName: req.body.values.firstName, lastName: req.body.values.lastName, email: req.body.values.email, name: req.body.values.name };
        await DBService.updateUserInfo(req.user._id, userInfo);

        //await DBService.deleteUser(req.user._id);

        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.deleteAccount = async (req, res, next) => {
    //res.sendFile(path.join(__dirname, '../index.html'));
    try {
        await DBService.deleteUser(req.user._id);
        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getCurrentMeeting = async (req, res, next) => {
    try {
        let meeting = await DBService.findCurrentMeeting(req.user.currentMeetingId);
        const members = meeting.members;
        const users = []

        for (var i = 0; i < members.length; i++) {
            const mem = await DBService.findUser(members[i]);
            const name = mem.name;
            users.push(name);
        }

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
    try {
        let script = await DBService.findCurrentMeetingScript(req.user.currentMeetingId);
        res.send(script.text);
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getIsHost = async (req, res, next) => {
    try {
        let meeting = await DBService.findCurrentMeeting(req.user.currentMeetingId);
        const hostId = meeting.hostId;
        const userId = req.user._id;
        const isHost = (hostId == userId);
        res.send(isHost);
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
        await DBService.updateUserInfo(req.user._id, update);
        res.send('setIsMeetingFalseSuccess');
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getCurrentMeetingTitle = async (req, res, next) => {
    try {
        let meeting = await DBService.findCurrentMeeting(req.user.currentMeetingId);
        res.send(meeting.title);
    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getMeetingResult = async (req, res, next) => {
    try {
        let meeting = await DBService.findMeeting(req.params.meetingId);
        let script = await DBService.findScript(req.params.meetingId);
        let report = await DBService.findReport(req.params.meetingId);

        const members = meeting.visited;
        const users = []

        for (var i = 0; i < members.length; i++) {
            const mem = await DBService.findUser(members[i]);
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
    try {
        await DBService.updateScript(req.body.meetingId, req.body.script);
        await DBService.updateReport(req.body.meetingId, req.body.report);
        res.send('success');
    } catch (err) {
        console.error(err);
        next(err);
    }
}