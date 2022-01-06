const express=require(`express`);
const path=require(`path`);//내장모듈

const app=express();
const port=process.env.PORT||8001;

require(`dotenv`).config({path:path.join(__dirname,`./credentials/.env`)})

//body-parser : 요청의 본문에 있는 데이터를 해석하여 req.body객체로 만들어줌, json, 주소형식 데이터 받게함
app.use(express.json());
app.use(express.urlencoded({extended:true}));

//router 넣는 부분

if(process.env.NODE_ENV=='production'){
    //배포시
}else if(process.env.NODE_ENV=='development'){
    //개발시
    app.listen(port,()=>{
        console.log(`running on ${port}`);
    })
}
