const express = require(`express`);
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
const passportConfig = require('./passport');
const connect = require('./schemas');
const MongoStore = require('connect-mongo');
const path = require(`path`);//내장모듈

const app = express();
const httpServer = require(`http`).createServer(app);//httpserver
const cors = require(`cors`);
const io = require(`socket.io`)(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true
    }
});

app.set('port', process.env.PORT || 8001);

require(`dotenv`).config({ path: path.join(__dirname, `./credentials/.env`) })

const authRouter = require('./routes/auth');
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
let recording = recorder
    .record({
        sampleRateHertz: 16000,
        threshold: 0,
        // Other options, see https://www.npmjs.com/package/node-record-lpcm16#options
        verbose: false,
        recordProgram: 'sox', // Try also "arecord" or "sox"
        endOnSilence: false
    });

io.on("connection", (socket) => {//특정 브라우저와 연결이 됨


    socket.on("join-room", (roomName, userName, userNick) => {
        console.log(userNick + "join");
        socket.join(roomName);
        roomName = roomName;
        userName = userName;
        socket.to(roomName).emit('user-connected', userName, userNick);

        socket.on('disconnect', () => {
            socket.to(roomName).emit("user-disconnected", userName);
            console.log("disconnect")
            recording.stop();
        });

        const request = {
            config: {
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode: 'ko-KR',
            },
            interimResults: false, // If you want interim results, set this to true
        };

        // Create a recognize stream
        const recognizeStream = client
            .streamingRecognize(request)
            .on('error', console.error)
            .on('data', async function (data) {
                process.stdout.write(
                    data.results[0] && data.results[0].alternatives[0]
                        ? `${data.results[0].alternatives[0].transcript}\n`
                        : '\n\nReached transcription time limit, press Ctrl+C\n'
                );
                io.sockets.in(roomName).emit("msg", userNick, data.results[0] && data.results[0].alternatives[0]
                    ? `${data.results[0].alternatives[0].transcript}\n`
                    : '\n\nReached transcription time limit, press Ctrl+C\n');

                //DB에 발화자와 발화 내용 저장
                // const content = data.results[0].alternatives[0].transcript;
                // content.replace('\n', '');
                // try {
                //     const result = await Script.findOneAndUpdate({
                //         meetingId: "620e08ae8c58cb57273f513b",
                //     }, {
                //         $push: { text: { nick: userNick, content: content } },
                //     });
                // } catch (err) {
                //     console.error(err);
                // }
            }
            );



        recording.stream()
            .on('error', console.error)
            .pipe(recognizeStream);//시작



    })
});


httpServer.listen(3001, () => {
    console.log("listne port 3001");
})