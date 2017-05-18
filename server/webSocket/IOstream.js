const createAMIstream = require('./AMI.js').emitter;
// var aio = require('asterisk.io');


function createStream(socket, ami) {
    socket.emit('greeting', 'Xin Chào!');
    createAMIstream(socket, ami);
}

module.exports = createStream;