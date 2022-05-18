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


app.set('port', process.env.PORT || 8001);

require(`dotenv`).config({ path: path.join(__dirname, `../credentials/.env`) })

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


app.use('/', (req, res, next) => {
    res.send("hello");
    next();
});
app.use((req, res) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    console.log(error);
});

httpServer.listen(3001, () => {
    console.log("listen port 3001");
})

