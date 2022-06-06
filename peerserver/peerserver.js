const ExpressPeerServer = require('peer').ExpressPeerServer;
const express = require('express');
const app = express();
const fs = require(`fs`);
const peerServer = require(`https`).createServer({
    cert: fs.readFileSync('/etc/nginx/certificate/nginx-certificate.crt'),
    key: fs.readFileSync('/etc/nginx/certificate/nginx.key'),
}, app);

const options = { debug: true }
const peerPort = 3003;


app.use('/peerjs', ExpressPeerServer(peerServer, options));

peerServer.listen(peerPort, () => {
    console.log('peerServer listen ' + peerPort);
});
