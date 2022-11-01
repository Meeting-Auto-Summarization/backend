const express = require('express');
const app = express();
const morgan = require('morgan');

const socketServer = require(`http`).createServer(app);
const path = require(`path`);//내장모듈
const session = require('express-session');
const connect = require('../was/schemas');
const MongoStore = require('connect-mongo');
const Script = require('../was/schemas/script');

require(`dotenv`).config({ path: path.join(__dirname, `../credentials/.env`) })

const socketPort = process.env.PORT || 3002;



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
    });
    socket.on("summaryAlert", async (summaryFlag) => {
        const roomName = socket.roomName;
        io.to(roomName).emit("summaryOffer", summaryFlag);
        rooms[roomName].isSummary = summaryFlag;
        console.log(socket.id);
        console.log(rooms[roomName].members);
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
            if (temp) {//들어왔는데 summary중임
                console.log(socket.id + " : 요약시작")
            }
            rooms[roomName].members.push(socket.id);
            rooms[roomName].userNicks.push(userNick);

        } else {
            rooms[roomName] = {};
            rooms[roomName].isSummary = false;
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
    });

});

socketServer.listen(socketPort, () => {
    console.log('socketServer listen ' + socketPort);
});
