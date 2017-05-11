const socketIO = require('socket.io');
const createStream = require('./IOstream.js');

function createWebSocket(server) {
    var io = socketIO(server);
    io.on('connection', (socket) => {
        console.log('New Connection');
        createStream(socket);
    })
}
module.exports = createWebSocket;