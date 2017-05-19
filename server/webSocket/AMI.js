const listener = require('./listener.js');
const emitter = require('./emitter.js');


function createAMIstream(socket, ami, dbconnection) {
    listener(ami, socket);
    emitter(ami, socket, dbconnection);
}

module.exports.emitter = createAMIstream;