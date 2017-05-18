const socketIO = require('socket.io');
const createStream = require('./IOstream.js');
const configPBXservers = require('../../config.js').configPBXservers;
var aio = require('asterisk.io');

function createWebSocket(server) {
    var io = socketIO(server);

    var AMIservers = configPBXservers.map(configPBX => {
        return {
            namespace: configPBX.company,
            server: aio.ami(
                configPBX.asterisk.ASTERISK_SERVER_IP,
                configPBX.asterisk.ASTERISK_SERVER_PORT,
                configPBX.asterisk.ASTERISK_USERNAME,
                configPBX.asterisk.ASTERISK_PASSWORD
            )
        };
    });
    AMIservers.forEach(function (AMI) {
        AMI.server.on('ready', function () {
            console.log(AMI.namespace,"is ready to connect");
            io.of('/'+AMI.namespace).on('connection', (socket) => {
                console.log('new connection')
                createStream(socket, AMI.server);
            })
        });
    });
    // ami.on('ready', function () {
    //     io.of('/abc').on('connection', (socket) => {
    //         console.log('new connection')
    //         createStream(socket, ami);
    //     })
    // });

}
module.exports = createWebSocket;