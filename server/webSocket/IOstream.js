const createAMIstream = require('./AMI.js').emitter;
// var aio = require('asterisk.io');


function createStream(socket, ami, dbconnection) {
    socket.emit('greeting', 'Xin Chào!');
    createAMIstream(socket, ami, dbconnection);
}

module.exports = createStream;