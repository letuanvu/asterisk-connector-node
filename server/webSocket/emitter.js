const _ = require('lodash');

function emitter(ami, socket, dbconnection) {
    ami.on('error', function (err) { // ket noi den PBX bi loi, gui di 1 loi
        socket.emit('errorAMI', 'Có lỗi xảy ra! Vui lòng thử lại.');
    });
    console.log('ready');
    ami.on('eventAny', function (data) { //lang nghe tat ca su kien tu PBX va gui di
        socket.emit('info', data);
    });

}

module.exports = emitter;