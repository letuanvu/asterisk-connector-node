const listener = require('./listener.js');
const emitter = require('./emitter.js');


function createAMIstream(socket, ami, dbconnection) {
    listener(ami, socket); // tao listener
    emitter(ami, socket, dbconnection); //tao emitter
}

module.exports.emitter = createAMIstream;