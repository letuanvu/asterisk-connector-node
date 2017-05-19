const socketIO = require('socket.io');
const createStream = require('./IOstream.js');
const configPBXservers = require('../../config.js').configPBXservers;
const aio = require('asterisk.io');
const FormData = require('form-data');
const request = require('request');

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
            console.log(AMI.namespace, "is ready to connect");
            io.of('/' + AMI.namespace).use(function (socket, next) {
                var handshakeData = socket.request;
                console.log(handshakeData._query.token, handshakeData._query.cookie)
                if (handshakeData._query.token) {
                    var formData = {
                        module: 'PBXManager',
                        action: 'PBXauth',
                        __vtrftk: handshakeData._query.token
                    }
                    request.post({
                        url: 'http://192.168.100.136/vtigercrm7/index.php',
                        headers: {
                            'cookie': handshakeData._query.cookie
                        },
                        formData: formData
                    }, (err, res, body) => {
                        console.log(body)
                        if (err) {
                            next(new Error('Cannot connect to vtiger crm'));
                        } else {
                            if(body == 'Invalid request') {
                                next(new Error('Not authorized'));
                            } else if (JSON.parse(body).success) {
                                next();
                            } else {
                                next(new Error('Not authorized'));
                            }
                        }
                    });
                } else {
                    next(new Error('not authorized'));
                }
            });
            io.of('/' + AMI.namespace).on('connection', (socket) => {
                console.log('new connection');

                createStream(socket, AMI.server);
            });
        });
    });
}
module.exports = createWebSocket;