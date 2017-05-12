const _ = require('lodash');

function isValueExist(o, value) {
    for (var prop in o) {
        if (o.hasOwnProperty(prop) &&  _.includes(o[prop], value)) {
            return true;
        }
    }
    return false;
}

module.exports.isValueExist = isValueExist;