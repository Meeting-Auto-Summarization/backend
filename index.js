const express = require(`express`);
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
const passportConfig = require('./passport');
const connect = require('./schemas');
const path = require(`path`);//내장모듈

const app = express();
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
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
}));
app.use(passport.initialize());
app.use(passport.session());

//router 넣는 부분
app.use('/auth', authRouter);
app.use('/db', dbRouter);

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
    res.render('error');
});

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기중');
});