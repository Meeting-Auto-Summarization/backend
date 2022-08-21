const express = require('express');
const app = express();
const morgan = require('morgan');
const fs = require(`fs`);
const socketServer = require(`http`).createServer(app);
const path = require(`path`);//내장모듈
const session = require('express-session');
const connect = require('../was/schemas');
const MongoStore = require('connect-mongo');
const Script = require('../was/schemas/script');

require(`dotenv`).config({ path: path.join(__dirname, `../credentials/.env`) })

const socketPort = 3002;
/*const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");


const pubClient = createClient({ host: '127.0.0.1', port: 6379 });
const subClient = pubClient.duplicate();
const { Emitter } = require("@socket.io/redis-emitter");
const emitter = new Emitter(pubClient);*/

let rooms = {};

app.use(morgan('dev'));

const io = require(`socket.io`)(socketServer, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true
    }
});

connect();

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL_PROD
    }),
}));
/*io.adapter(createAdapter(pubClient, subClient));


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

*/


const calTime = (meetingTime) => {//발화시간 계산 함수
    const curTime = new Date();
    const elapsedTime = (curTime.getTime() - meetingTime.getTime()) / 1000;

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
    socket.on("getSttResult", async function (msg) {
        console.log(msg);
        const time = calTime(new Date(rooms[socket.roomName].createMeetingTime));
        io.to(socket.roomName).emit('msg', socket.userNick, time, msg);

        try {
            await Script.findOneAndUpdate({
                meetingId: socket.roomName,
            }, {
                $push: { text: { nick: socket.userNick, content: msg, time: time } },
            });
        } catch (err) {
            console.error(err);
        }

        if (rooms[socket.roomName] !== undefined) {
            //pubClient.publish("new_message", JSON.stringify({ roomName: socket.roomName, len: rooms[socket.roomName].script.length, script: { time: time, isChecked: false, nick: socket.userNick, content: msg } }));
        }
    });
    socket.on("summaryAlert", async (summaryFlag) => {
        const roomName = socket.roomName;
        io.to(roomName).emit("summaryOffer", summaryFlag);
        rooms[roomName].isSummary = summaryFlag;
        console.log(socket.id);
        console.log(rooms[roomName].members);
        // pubClient.publish("summaryAlert", JSON.stringify({ roomName: roomName, state: summaryFlag }));
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
            try {
                const scripts = await Script.findOne({ meetingId: socket.roomName, });
                socket.emit("initScripts", scripts.text);
            } catch (err) {
                console.error(err);
            }

            //socket.emit("initScripts", rooms[roomName].script);

            //console.log(rooms[roomName].script);
            if (temp) {//들어왔는데 summary중임
                console.log(socket.id + " : 요약시작")
            }
            rooms[roomName].members.push(socket.id);
            rooms[roomName].userNicks.push(userNick);

        } else {
            //pubClient.publish("new_room", JSON.stringify({ roomName: roomName, roomInfo: { hostId: socket.id, createMeetingTime: currentMeetingTime } }))
            rooms[roomName] = {};
            rooms[roomName].isSummary = false;
            //rooms[roomName].script = [];
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
    socket.on("handleCheck", async function (index, isChecked) {
        //rooms[socket.roomName].script[index].isChecked = isChecked
        io.to(socket.roomName).emit('checkChange', index, isChecked);
        console.log("handleCheck : " + index + ', ' + isChecked);
        try {
            await Script.findOneAndUpdate({
                meetingId: socket.roomName
            }, {
                $set: { [`text.${index}.isChecked`]: isChecked },
            });

        } catch (err) {
            console.error(err);
        }

        //    pubClient.publish("checkChange", JSON.stringify({ roomName: socket.roomName, index: index, isChecked: isChecked }));
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