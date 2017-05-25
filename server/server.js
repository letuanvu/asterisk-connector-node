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
//tao 1 express server
var server = http.createServer(app);
//tao 1 socket server
createWebSocket(server);
//su dung duong dan public de truyen cac file static
app.use(express.static(publicPath));
//set view engine
app.set('view engine', 'ejs');


//phuong thuc get de lay trang index quan ly ca pbx hien tai
app.get('/', function (req, res) {
    var companyList = configPBXservers.map(confPBX => confPBX.company);
    res.render('index', {
        companyList
    });
});


//phuong thuc get de lay trang quan ly 1 pbx cu the
app.get('/:namespace', function (req, res) {
    res.render('detail', {
        namespace: req.params.namespace
    });
});

//phuong thuc get de lay file ghi am cua 1 cuc goi tu 1 pbx cu the
app.get('/:company/:path/:filename', (req, res) => {
    //tim ten pbx trong config
    configPBXservers.forEach(function (confPBX) {
        if (req.params.company == confPBX.company) {
            //tao 1 ket noi ftp den server pbx
            var c = new Client();
            c.connect(confPBX.ftp);
            c.on('ready', function () { 
                //get file ghi am tu server ftp
                c.get('/ysDisk_1/autorecords/' + req.params.path + '/' + req.params.filename + '.wav', function (err, stream) {
                    if (err) console.log(err);
                    //neu stream bi dong thi ket thuc ket noi ftp
                    stream.once('close', function () { c.end(); });
                    //luu file ghi am vao folder storage
                    var streamfile = stream.pipe(fs.createWriteStream(storagePath + '/' + req.params.filename + '.wav'));
                    //neu luu file xong
                    streamfile.on('finish', () => {
                        //tra ra browser client 1 download
                        res.download(storagePath + '/' + req.params.filename + '.wav', req.params.filename + '.wav', (errDown) => {
                            if (errDown) {
                                console.log(errDown, 'download error')
                            }
                            //doanload xong thi xoa file ghi am trong folder storage
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