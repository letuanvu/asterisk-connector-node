const createAMIemitter = require('./AMI.js').emitter;
// var aio = require('asterisk.io');


function createEmitter(socket) {
    socket.emit('greeting', 'Xin Chào!');
    createAMIemitter(socket);
}

module.exports = createEmitter;