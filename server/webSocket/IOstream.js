const createAMIstream = require('./AMI.js').emitter;
// var aio = require('asterisk.io');


function createStream(socket) {
    socket.emit('greeting', 'Xin Chào!');
    createAMIstream(socket);
}

module.exports = createStream;