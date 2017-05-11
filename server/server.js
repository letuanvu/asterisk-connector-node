const path = require('path');
const express = require('express');
const http = require('http');
const publicPath = path.join(__dirname, '../public');
const createWebSocket = require('./webSocket/index.js');

var app = express();
var server = http.createServer(app);
createWebSocket(server);


app.use(express.static(publicPath));

server.listen(4000, () => {
    console.log('app is running');
})