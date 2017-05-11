function createListener(socket) {
    socket.on('disconnect', () => {
        console.log('User was disconnected');
    });

    socket.on('command', (data, cb) => {
        if (data && data != "") {
            socket.emit('command', data);
            cb();
        }
    })
}

module.exports = createListener;