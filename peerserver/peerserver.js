const ExpressPeerServer = require('peer').ExpressPeerServer;
const express = require('express');
const app = express();

const peerServer = require(`http`).createServer(app);

const options = { debug: true }
const peerPort = 3003;


app.use('/peerjs', ExpressPeerServer(peerServer, options));

peerServer.listen(peerPort, () => {
    console.log('peerServer listen ' + peerPort);
});