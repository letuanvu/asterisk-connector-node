function emitter(ami, socket) {
    ami.on('error', function (err) {
        socket.emit('errorAMI', 'Có lỗi xảy ra! Vui lòng thử lại.');
    });

    ami.on('ready', function () {
        console.log('ready');
        ami.on('eventAny', function (data) {
            socket.emit('info', data);
            // if (data.Event == 'Newstate' && data.ChannelStateDesc == 'Ringing' && !data.Channel.includes(data.CallerIDNum)) {
            //     var info = 'Co cuoc goi tu so ' + data.CallerIDNum + ' den kenh ' + data.Channel;
            //     console.log(info);
            // }
            // if (data.Event == 'Dial' && data.CallerIDNum) {
            //     var otherinfo = 'Co cuoc goi tu so ' + data.CallerIDNum + ' den so ' + data.Dialstring;
            //     console.log(otherinfo);
            // }
        });
    });
}

module.exports = emitter;