const socketIO = require('socket.io');
const createEmitter = require('./emitter.js');
const createListener = require('./listener.js');

function createWebSocket(server) {
    var io = socketIO(server);
    io.on('connection', (socket) => {
        console.log('New Connection');
        createListener(socket);
        createEmitter(socket);
    })
}
module.exports = createWebSocket;