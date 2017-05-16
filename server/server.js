const path = require('path');
const express = require('express');
const http = require('http');
const publicPath = path.join(__dirname, '../public');
const storagePath = path.join(__dirname, '/storage');
const createWebSocket = require('./webSocket/index.js');
const Client = require('ftp');
const fs = require('fs');
const confFTP = require('../config.js').configFTP;

var app = express();
var server = http.createServer(app);
createWebSocket(server);
global.eventFilter = 'all';
global.contentFilter = 'all';
app.use(express.static(publicPath));


app.get('/download/:path/:filename', (req, res) => {
    var c = new Client();
    c.connect(confFTP);
    c.on('ready', function () { //ysDisk_1/autorecords/20170515/20170515144653-Outbound-pstn1-117-01653114489.wav
        ///20170516/20170516155637-Outbound-pstn2-128-0947229824.wav
        c.get('/ysDisk_1/autorecords/' + req.params.path + '/' + req.params.filename + '.wav', function (err, stream) {
            if (err) console.log(err);
            stream.once('close', function () { c.end(); });
            var streamfile = stream.pipe(fs.createWriteStream(storagePath + '/' + req.params.filename + '.wav'));
            streamfile.on('finish', () => {
                res.download(storagePath + '/' + req.params.filename + '.wav', req.params.filename + '.wav', (errDown) => {
                    if (errDown) {
                        console.log(errDown)
                    }
                    fs.unlink(storagePath + '/' + req.params.filename + '.wav', (e) => {
                        console.log(e)
                    });
                });
            })
        });
    });
})

server.listen(3000, () => {
    console.log('app is running');
})