module.exports={
    apps:[
        {
            name:'mas_server',
            script:'./index.js',
            instances:3,//0이면 CPU 코어수만큼
            exec_mode:'cluster',
        }
    ]
}