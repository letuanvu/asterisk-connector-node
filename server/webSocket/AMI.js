const listener = require('./listener.js');
const emitter = require('./emitter.js');


function createAMIstream(socket, ami) {
    listener(ami, socket);
    emitter(ami, socket);
}

module.exports.emitter = createAMIstream;