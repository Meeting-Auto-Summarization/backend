const express = require(`express`);
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
const passportConfig = require('./passport');
const connect = require('./schemas');
const MongoStore = require('connect-mongo');
const path = require(`path`);//내장모듈

const Script = require('./schemas/script');
const Meeting = require('./schemas/meeting');

const app = express();
const httpServer = require(`http`).createServer(app);//httpserver
const cors = require(`cors`);
const io = require(`socket.io`)(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true
    }
});
let rooms = {};

app.set('port', process.env.PORT || 8001);

require(`dotenv`).config({ path: path.join(__dirname, `./credentials/.env`) })

const authRouter = require('./routes/auth-route');
const dbRouter = require('./routes/db-route');

connect();
passportConfig();

app.use(morgan('dev'));
//body-parser : 요청의 본문에 있는 데이터를 해석하여 req.body객체로 만들어줌, json, 주소형식 데이터 받게함
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL_PROD
    }),
}));

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(passport.initialize());
app.use(passport.session());

//router 넣는 부분
app.use('/auth', authRouter);
app.use('/db', dbRouter);
app.use('/', (req, res) => {
    res.send("hello");
});
if (process.env.NODE_ENV == 'production') {
    //배포시
} else if (process.env.NODE_ENV == 'development') {
    //개발시
    app.listen(port, () => {
        console.log(`running on ${port}`);
    })
}

app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    next(error);
});

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
    res.status(err.status || 500);
    res.send(err);
});
const recorder = require('node-record-lpcm16');

// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');

// Creates a client
const client = new speech.SpeechClient();

// Start recording and send the microphone input to the Speech API.
// Ensure SoX is installed, see https://www.npmjs.com/package/node-record-lpcm16#dependencies

const request = {
    config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'ko-KR',
    },
    interimResults: false, // If you want interim results, set this to true
};
io.on("connection", (socket) => {//특정 브라우저와 연결이 됨
    socket.on("meetingEnd", async (isHost) => {
        if (isHost) {
            try {
                const result = await Script.findOneAndUpdate({
                    meetingId: socket.roomName,
                }, {
                    //$push: { text: { nick: userNick, content: content } },
                    text: rooms[socket.roomName].script,
                });
            } catch (err) {
                console.error(err);
            }
        }
    });
    socket.on("summaryAlert", async (summaryFlag) => {
        console.log("summaryAlert");
        const roomName = socket.roomName;
        io.sockets.in(roomName).emit("summaryOffer", summaryFlag);
        rooms[roomName].isSummary = summaryFlag;
        console.log(socket.id);
        console.log(rooms[roomName].members);
        let createMeetingTime;
        try {
            const meetingInfo = await Meeting.findOne({ _id: roomName });
            createMeetingTime = meetingInfo.date;
        } catch (err) {
            console.error(err);
        }
        if (summaryFlag) {
            let id;
            for (let i = 0; i < rooms[roomName].members.length; i++) {
                id = rooms[roomName].members[i];
                userNick = rooms[roomName].userNicks[i];
                //recordingStart(id, socket.userNick, createMeetingTime, roomName, socket.device);
                console.log(id)
                startRecognitionStream(id, userNick, createMeetingTime, roomName, request);
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

    socket.on("join-room", async (roomName, userName, userNick) => {
        console.log(userNick + "join");
        // io.sockets.adapter.rooms.clear()
        socket.join(roomName);
        socket.on("ready", () => {
            socket.to(roomName).emit('user-connected', userName, userNick);
        })
        socket["userNick"] = userNick;
        socket["roomName"] = roomName;
        console.log(socket.id);
        console.log(rooms);
        let createMeetingTime;
        try {
            const meetingInfo = await Meeting.findOne({ _id: roomName });
            createMeetingTime = meetingInfo.date;
        } catch (err) {
            console.error(err);
        }
        if (rooms[roomName]) {
            //summaryflag값전달
            const temp = rooms[roomName].isSummary;
            socket.emit("initSummaryFlag", temp);
            socket.emit("initScripts", rooms[roomName].script);
            console.log(rooms[roomName].script);
            if (temp) {//들어왔는데 summary중임
                ///
                ///recordingStart(socket.id, socket.userNick, createMeetingTime, roomName);
                startRecognitionStream(socket.id, socket.userNick, createMeetingTime, roomName, request);
                ///
                console.log(socket.id + " : 요약시작")
            }
            rooms[roomName].members.push(socket.id);
            rooms[roomName].userNicks.push(userNick);

        } else {
            rooms[roomName] = {};
            rooms[roomName].isSummary = false;
            rooms[roomName].script = [];
            rooms[roomName].members = [socket.id];
            rooms[roomName].userNicks = [userNick];
            rooms[roomName].recording = {};
            rooms[roomName].createMeetingTime = createMeetingTime;
            rooms[roomName].hostId = socket.id;
            ///
            //rooms[roomName].recognizeStream = null;
            rooms[roomName].recognizeStream = {};
            ///
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
                //rooms[roomName].recognizeStream[socket.id] = null;


                //recording 지움
                rooms[roomName].members = rooms[roomName].members.filter((element) => element !== socket.id);
                if (rooms[roomName].hostId === socket.id) {
                    rooms[roomName].members.forEach((e) => {
                        if (rooms[roomName].recognizeStream[e]) {
                            rooms[roomName].recognizeStream[e].end();
                        }
                        rooms[roomName].recognizeStream[e] = null;
                    })
                    delete rooms[roomName];

                }
            }

            /*if (rooms[roomName].members === []) {
                //
                delete rooms[roomName];
            }*/

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

httpServer.listen(3001, () => {
    console.log("listen port 3001");
})
//발화시간 계산 함수
function calTime(meetingTime) {
    const curTime = new Date();
    const elapsedTime = (curTime.getTime() - meetingTime.getTime()) / 1000;

    return parseInt(elapsedTime);
}

///
function startRecognitionStream(id, userNick, createMeetingTime, roomName, request) {
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
            const time = calTime(createMeetingTime);
            io.sockets.in(roomName).emit("msg", userNick, time, data.results[0] && data.results[0].alternatives[0]
                ? `${data.results[0].alternatives[0].transcript}\n`
                : '\n\nReached transcription time limit, press Ctrl+C\n');
            console.log('data 이벤트 발생: ' + userNick);

            //DB에 발화자와 발화 내용 저장
            const content = data.results[0].alternatives[0].transcript;
            content.replace('\n', '');
            rooms[roomName].script.push({ time: time, isChecked: false, nick: userNick, content: content })
        });
}

function receiveData(id, roomName, data) {
    console.log("receive");
    if (rooms[roomName].recognizeStream[id]) {
        rooms[roomName].recognizeStream[id].write(data);
    }
}
//peerServer
var ExpressPeerServer = require('peer').ExpressPeerServer;
var peerExpress = require('express');
var peerApp = peerExpress();
var peerServer = require('http').createServer(peerApp);
var options = { debug: true }
var peerPort = 3002;

peerApp.use('/peerjs', ExpressPeerServer(peerServer, options));
peerServer.listen(peerPort, () => {
    console.log('peerServer listen ' + peerPort);
})