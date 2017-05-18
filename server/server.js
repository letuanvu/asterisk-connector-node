const path = require('path');
const express = require('express');
const http = require('http');

const publicPath = path.join(__dirname, '../views');
const storagePath = path.join(__dirname, '/storage');
const createWebSocket = require('./webSocket/index.js');
const Client = require('ftp');
const fs = require('fs');
const configPBXservers = require('../config.js').configPBXservers;

var app = express();
var server = http.createServer(app);
createWebSocket(server);
app.use(express.static(publicPath));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    var companyList = configPBXservers.map(confPBX => confPBX.company);
    res.render('index', {
        companyList
    });
});

app.get('/:namespace', function (req, res) {
    res.render('detail', {
        namespace: req.params.namespace
    });
});

app.get('/:company/:path/:filename', (req, res) => {
    configPBXservers.forEach(function (confPBX) {
        if (req.params.company == confPBX.company) {
            var c = new Client();
            c.connect(confPBX.ftp);
            c.on('ready', function () { //ysDisk_1/autorecords/20170515/20170515144653-Outbound-pstn1-117-01653114489.wav
                ///20170516/20170516155637-Outbound-pstn2-128-0947229824.wav
                c.get('/ysDisk_1/autorecords/' + req.params.path + '/' + req.params.filename + '.wav', function (err, stream) {
                    if (err) console.log(err);
                    stream.once('close', function () { c.end(); });
                    var streamfile = stream.pipe(fs.createWriteStream(storagePath + '/' + req.params.filename + '.wav'));
                    streamfile.on('finish', () => {
                        res.download(storagePath + '/' + req.params.filename + '.wav', req.params.filename + '.wav', (errDown) => {
                            if (errDown) {
                                console.log(errDown, 'download error')
                            }
                            fs.unlink(storagePath + '/' + req.params.filename + '.wav', (e) => {
                                console.log(e)
                            });
                        });
                    })
                });
            });
        }
    });

})

server.listen(3000, () => {
    console.log('app is running');
})