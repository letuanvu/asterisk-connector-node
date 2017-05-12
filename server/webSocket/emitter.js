const util = require('../utilities/util.js');

function emitter(ami, socket) {
    ami.on('error', function (err) {
        socket.emit('errorAMI', 'Có lỗi xảy ra! Vui lòng thử lại.');
    });

    ami.on('ready', function () {
        console.log('ready');
        ami.on('eventAny', function (data) {
            if (eventFilter == 'all' && contentFilter == 'all') {
                var emitData = {
                    eventFilter,
                    contentFilter,
                    info: data
                }
                socket.emit('info', emitData);
            } else if (eventFilter == 'all' && contentFilter != 'all') {
                if (util.isValueExist(data, contentFilter)) {
                    var emitData = {
                        eventFilter,
                        contentFilter,
                        info: data
                    }
                    socket.emit('info', emitData);
                }
            } else if (eventFilter != 'all' && contentFilter == 'all') {
                if (data.Event == eventFilter) {
                    var emitData = {
                        eventFilter,
                        contentFilter,
                        info: data
                    }
                    socket.emit('info', emitData);
                }
            } else {
                if (data.Event == eventFilter && util.isValueExist(data, contentFilter)) {
                    var emitData = {
                        eventFilter,
                        contentFilter,
                        info: data
                    }
                    socket.emit('info', emitData);
                }
            }
        });
    });
}

module.exports = emitter;