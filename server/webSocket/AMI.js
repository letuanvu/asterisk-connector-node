var aio = require('asterisk.io');
const listener = require('./listener.js');
const emitter = require('./emitter.js');
const { ASTERISK_SERVER_IP,
    ASTERISK_SERVER_PORT,
    ASTERISK_USERNAME,
    ASTERISK_PASSWORD } = require('../../config.js').generalConfig;

function createAMIstream(socket) {
    const ami = aio.ami(
        ASTERISK_SERVER_IP,
        ASTERISK_SERVER_PORT,
        ASTERISK_USERNAME,
        ASTERISK_PASSWORD
    );
    listener(ami, socket);
    emitter(ami, socket);
}

module.exports.emitter = createAMIstream;