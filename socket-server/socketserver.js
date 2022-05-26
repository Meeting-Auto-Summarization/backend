const express = require('express');
const app = express();
const morgan = require('morgan');
const socketServer = require(`http`).createServer(app);

const socketPort = 3002;
const io = require(`socket.io`)(socketServer, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true
    }
});
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } =require("redis");

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();
subClient.subscribe("new_room");
io.adapter(createAdapter(pubClient,subClient));
let rooms = {};

app.use(morgan('dev'));


// 구글 STT 및 소켓
const speech = require('@google-cloud/speech');
const request = {
    config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'ko-KR',
    },
    interimResults: false, // If you want interim results, set this to true
};
const calTime = (meetingTime) => {//발화시간 계산 함수
    const curTime = new Date();
    const elapsedTime = (curTime.getTime() - meetingTime.getTime()) / 1000;

    return parseInt(elapsedTime);
}

const startRecognitionStream = (id, userNick, createMeetingTime, roomName, request) => {
    // Creates a client
    let client = new speech.SpeechClient();
    rooms[roomName].recognizeStream[id] = client
        .streamingRecognize(request)
        .on('error', console.error)
        .on('data', async function (data) {
            process.stdout.write(
                data.results[0] && data.results[0].alternatives[0]
                    ? `${data.results[0].alternatives[0].transcript}\n`
                    : '\n\nReached transcription time limit, press Ctrl+C\n'
            );
            const time = calTime(new Date(createMeetingTime));
            io.sockets.in(roomName).emit("msg", userNick, time, data.results[0] && data.results[0].alternatives[0]
                ? `${data.results[0].alternatives[0].transcript}\n`
                : '\n\nReached transcription time limit, press Ctrl+C\n');
            console.log('data 이벤트 발생: ' + userNick);

            //DB에 발화자와 발화 내용 저장
            const content = data.results[0].alternatives[0].transcript;
            content.replace('\n', '');
            if (rooms[roomName] !== undefined) {
                rooms[roomName].script.push({ time: time, isChecked: false, nick: userNick, content: content })
            }
        });
}

const receiveData = (id, roomName, data) => {
    if (rooms[roomName] !== undefined) {
        if (rooms[roomName].recognizeStream[id]) {
            rooms[roomName].recognizeStream[id].write(data);
        }
    }
}

io.on("connection", (socket) => {//특정 브라우저와 연결이 됨
    socket.on("meetingEnd", async (isHost) => {
        try {
            rooms[socket.roomName].members.forEach((e) => {
                if (rooms[socket.roomName].recognizeStream[e]) {
                    rooms[socket.roomName].recognizeStream[e].end();
                }
                rooms[socket.roomName].recognizeStream[e] = null;
            })
            delete rooms[socket.roomName];

        } catch (err) {
            console.error(err);
        }
    });
    socket.on("summaryAlert", async (summaryFlag) => {
        const roomName = socket.roomName;
        io.sockets.in(roomName).emit("summaryOffer", summaryFlag);
        rooms[roomName].isSummary = summaryFlag;
        console.log(socket.id);
        console.log(rooms[roomName].members);
        /*let createMeetingTime;
        try {
            const meetingInfo = await Meeting.findOne({ _id: roomName });
            createMeetingTime = meetingInfo.date;
        } catch (err) {
            console.error(err);
        }*/
        if (summaryFlag) {
            let id;
            for (let i = 0; i < rooms[roomName].members.length; i++) {
                id = rooms[roomName].members[i];
                userNick = rooms[roomName].userNicks[i];
                //recordingStart(id, socket.userNick, createMeetingTime, roomName, socket.device);
                console.log(id)
                startRecognitionStream(id, userNick, rooms[roomName].createMeetingTime, roomName, request);
            }
            console.log(socket.id + " : 요약시작")
        } else {
            let id;
            for (let i = 0; i < rooms[roomName].members.length; i++) {
                id = rooms[roomName].members[i];
                console.log(id);
                //rooms[roomName].recording[id].stop();
                if (rooms[roomName].recognizeStream[id]) {
                    rooms[roomName].recognizeStream[id].end();
                }
                rooms[roomName].recognizeStream[id] = null;
            }
            console.log(socket.id + " : 요약중지");
        }
    })

    ///
    socket.on('binaryAudioData', function (data) {
        const roomName = socket.roomName;
        receiveData(socket.id, roomName, data);
    });

    subClient.on("message",(channel,msg)=>{//roominfo
        console.log(msg);
        if(channel=="new_room"){
        const roomInfo=JSON.parse(msg);
        const roomName=roomInfo.roomName;
        const hostId=roomInfo.hostId;
        const createMeetingTime=roomInfo.createMeetingTime;
        if(rooms[roomName]===undefined){
            //host,createMeetingTime만있으면될듯
            rooms[roomName] = {};
            rooms[roomName].isSummary = false;
            rooms[roomName].script = [];
            rooms[roomName].members = [];
            rooms[roomName].userNicks = [];
            //rooms[roomName].recording = {};
            rooms[roomName].createMeetingTime = createMeetingTime ;
            rooms[roomName].hostId = hostId;
            rooms[roomName].recognizeStream = {};
            console.log(rooms);
        }
    }
    })
    socket.on("join-room", async (roomName, userName, userNick, currentMeetingTime) => {
        console.log(userNick + "join");
        socket.join(roomName);
        socket.on("ready", () => {
            socket.to(roomName).emit('user-connected', userName, userNick);
        })
        socket["userNick"] = userNick;
        socket["roomName"] = roomName;
        console.log(socket.id);
        console.log(rooms);
    
        if (rooms[roomName]) {
            //summaryflag값전달
            const temp = rooms[roomName].isSummary;
            socket.emit("initSummaryFlag", temp);
            socket.emit("initScripts", rooms[roomName].script);
            console.log(rooms[roomName].script);
            if (temp) {//들어왔는데 summary중임
                ///recordingStart(socket.id, socket.userNick, createMeetingTime, roomName);
                startRecognitionStream(socket.id, socket.userNick, currentMeetingTime, roomName, request);
                console.log(socket.id + " : 요약시작")
            }
            rooms[roomName].members.push(socket.id);
            rooms[roomName].userNicks.push(userNick);

        } else {
            pubClient.publish("new_room",JSON.stringify({roomName:roomName,hostId:socket.id,createMeetingTime:currentMeetingTime}))
            rooms[roomName] = {};
            rooms[roomName].isSummary = false;
            rooms[roomName].script = [];
            rooms[roomName].members = [socket.id];
            rooms[roomName].userNicks = [userNick];
            //rooms[roomName].recording = {};
            rooms[roomName].createMeetingTime = currentMeetingTime;
            rooms[roomName].hostId = socket.id;
            rooms[roomName].recognizeStream = {};
            socket.emit("initSummaryFlag", false);
        }
        console.log(rooms);
        socket.on('disconnect', () => {
            socket.to(roomName).emit("user-disconnected", userName);
            console.log("disconnect")
            if (rooms[roomName]) {
                if (rooms[roomName].recognizeStream[socket.id]) {
                    rooms[roomName].recognizeStream[socket.id].end();
                    delete rooms[roomName].recognizeStream[socket.id];
                }
                console.log(socket.id + " " + userNick);
                rooms[roomName].members = rooms[roomName].members.filter(e => {
                    return e !== socket.id;
                });
                rooms[roomName].userNicks = rooms[roomName].userNicks.filter(e => {
                    return e !== userNick;
                });
            }
            console.log(rooms);

        });
    });

    socket.on("micOnOff", (micStatus) => {
        if (micStatus) {
            //recordingStart(socket.id, socket.userNick, rooms[socket.roomName].createMeetingTime, socket.roomName, socket.device);
            startRecognitionStream(socket.id, socket.userNick, rooms[socket.roomName].createMeetingTime, socket.roomName, request);
        } else {
            //rooms[socket.roomName].recording[socket.id].stop();
            rooms[socket.roomName].recognizeStream[socket.id].end();
            rooms[socket.roomName].recognizeStream[socket.id] = null;
        }
    });

    socket.on("handleCheck", (index, isChecked) => {
        rooms[socket.roomName].script[index].isChecked = isChecked
        console.log("handleCheck : " + index);
        io.sockets.to(socket.roomName).emit("checkChange", rooms[socket.roomName].script);
        console.log(rooms[socket.roomName].script);
    });

});
pubClient.on('disconnect',()=>{
    pubClient.quit();
})

subClient.on('disconnect',()=>{
    subClient.quit();
})
socketServer.listen(socketPort, () => {
    console.log('socketServer listen ' + socketPort);
});