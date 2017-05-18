const _ = require('lodash');

function emitter(ami, socket) {
    ami.on('error', function (err) {
        socket.emit('errorAMI', 'Có lỗi xảy ra! Vui lòng thử lại.');
    });
    console.log('ready');
    ami.on('eventAny', function (data) {
        socket.emit('info', data);
    });
}

module.exports = emitter;