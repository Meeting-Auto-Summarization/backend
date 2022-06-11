const express = require('express');
const app = express();
const morgan = require('morgan');
const fs = require(`fs`);
const socketServer = require(`https`).createServer({
    cert: fs.readFileSync('/etc/nginx/certificate/nginx-certificate.crt'),
    key: fs.readFileSync('/etc/nginx/certificate/nginx.key'),
}, app);

const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const socketPort = process.env.PORT || 3002;

const pubClient = createClient({ host: '127.0.0.1', port: 6379 });
const subClient = pubClient.duplicate();
const { Emitter } = require("@socket.io/redis-emitter");
const emitter = new Emitter(pubClient);

let rooms = {};

app.use(morgan('dev'));

const io = require(`socket.io`)(socketServer, {
    cors: {
        origin: "https://ec2-3-38-49-118.ap-northeast-2.compute.amazonaws.com",
        credentials: true
    }
});
io.adapter(createAdapter(pubClient, subClient));


subClient.subscribe("new_room");
subClient.subscribe("new_message");
subClient.subscribe("summaryAlert");
subClient.subscribe("checkChange");
subClient.subscribe("checkOtherRoom");
subClient.subscribe("backupOtherRoom");
subClient.on("message", (channel, msg) => {//roominfo
    if (channel === "checkOtherRoom") {
        if (rooms !== {} && JSON.parse(msg) == {}) {
            pubClient.publish("backupOtherRoom", rooms);
        }
    } else if (channel === "backupOtherRoom") {
        if (rooms === {}) {
            for (const [key, value] of Object.entries(JSON.parse(rooms))) {
                rooms[key] = value;
                rooms[key].members = [];
                rooms[key].userNicks = [];
            }
        }
    }
});
subClient.on("message", (channel, msg) => {//roominfo
    console.log(channel);
    if (channel === "new_room") {
        const { roomName, roomInfo } = JSON.parse(msg);
        const hostId = roomInfo.hostId;
        const createMeetingTime = roomInfo.createMeetingTime;
        if (rooms[roomName] === undefined) {
            //host,createMeetingTime만있으면될듯
            rooms[roomName] = {};
            rooms[roomName].isSummary = false;
            rooms[roomName].script = [];
            rooms[roomName].members = [];
            rooms[roomName].userNicks = [];
            rooms[roomName].createMeetingTime = createMeetingTime;
            rooms[roomName].hostId = hostId;
            console.log(rooms);
        }
    } else if (channel === "new_message") {
        const { roomName, script } = JSON.parse(msg);
        console.log("새메시지 :" + script.time);
        rooms[roomName].script.push(script);
        console.log(rooms[roomName].script);
    } else if (channel === "summaryAlert") {
        const { roomName, state } = JSON.parse(msg);
        rooms[roomName].isSummary = state;
    } else if (channel === "checkChange") {
        const { roomName, index, isChecked } = JSON.parse(msg);
        if (rooms[roomName].script[index].isChecked !== isChecked) {
            rooms[roomName].script[index].isChecked = isChecked;
        }
    }
    console.log(rooms);
});




const calTime = (meetingTime, nowTime) => {//발화시간 계산 함수
    //const curTime = new Date();
    const elapsedTime = (nowTime - meetingTime.getTime()) / 1000;

    return parseInt(elapsedTime);
}

io.on("connection", (socket) => {//특정 브라우저와 연결이 됨
    console.log(io.sockets.adapter.rooms);
    socket.on("meetingEnd", async (isHost) => {
        try {
            delete rooms[socket.roomName];

        } catch (err) {
            console.error(err);
        }
    });
    socket.on("endEvent", () => {
        if (rooms[socket.roomName].isSummary) {
            socket.emit("restart");
        }
    })
    socket.on("getSttResult", (msg, nowTime) => {
        console.log(msg);
        const time = calTime(new Date(rooms[socket.roomName].createMeetingTime), nowTime);
        emitter.to(socket.roomName).emit('msg', socket.userNick, time, msg);
        if (rooms[socket.roomName] !== undefined) {
            pubClient.publish("new_message", JSON.stringify({ roomName: socket.roomName, len: rooms[socket.roomName].script.length, script: { time: time, isChecked: false, nick: socket.userNick, content: msg } }));
        }
    });
    socket.on("summaryAlert", async (summaryFlag) => {
        const roomName = socket.roomName;
        io.to(roomName).emit("summaryOffer", summaryFlag);
        rooms[roomName].isSummary = summaryFlag;
        console.log(socket.id);
        console.log(rooms[roomName].members);
        pubClient.publish("summaryAlert", JSON.stringify({ roomName: roomName, state: summaryFlag }));
    })


    socket.on("join-room", async (roomName, userName, userNick, currentMeetingTime) => {
        console.log(userNick + "join");
        socket.join(roomName);
        console.log(io.sockets.adapter.rooms);
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
                console.log(socket.id + " : 요약시작")
            }
            rooms[roomName].members.push(socket.id);
            rooms[roomName].userNicks.push(userNick);

        } else {
            pubClient.publish("new_room", JSON.stringify({ roomName: roomName, roomInfo: { hostId: socket.id, createMeetingTime: currentMeetingTime } }))
            rooms[roomName] = {};
            rooms[roomName].isSummary = false;
            rooms[roomName].script = [];
            rooms[roomName].members = [socket.id];
            rooms[roomName].userNicks = [userNick];
            rooms[roomName].createMeetingTime = currentMeetingTime;
            rooms[roomName].hostId = socket.id;
            socket.emit("initSummaryFlag", false);
        }
        console.log(rooms);
        socket.on('disconnect', () => {
            socket.to(roomName).emit("user-disconnected", userName);
            console.log("disconnect")
            if (rooms[roomName]) {
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
    socket.on("handleCheck", (index, isChecked) => {
        rooms[socket.roomName].script[index].isChecked = isChecked
        console.log("handleCheck : " + index);
        io.to(socket.roomName).emit("checkChange", rooms[socket.roomName].script);
        pubClient.publish("checkChange", JSON.stringify({ roomName: socket.roomName, index: index, isChecked: isChecked }));
    });

});
/*pubClient.on('disconnect',()=>{
    pubClient.quit();
})

subClient.on('disconnect',()=>{
    subClient.quit();
})*/
socketServer.listen(socketPort, () => {
    console.log('socketServer listen ' + socketPort);
});
