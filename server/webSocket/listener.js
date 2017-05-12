
function listener(ami, socket) {
    socket.on('disconnect', () => {
        console.log('User was disconnected');
    });

    socket.on('command', (data, cb) => {
        if (data && data != "") {
            socket.emit('command', data);
            executeCommand(data, socket, ami);
            cb();
        }
    })
}

function executeCommand(command, socket, ami) {
    var arrayCommand = command.split(" ");
    switch (arrayCommand[0]) {
        case "call":
            if (arrayCommand.length < 3) {
                socket.emit('errorAMI', 'Missing parameters!');
            } else {
                var emitData = {
                    eventFilter,
                    contentFilter,
                    info: 'Excuting command ' + command
                }
                socket.emit('info', emitData);
                ami.action(
                    'Originate',
                    {
                        Channel: 'SIP/' + arrayCommand[1],
                        Context: 'DLPN_DialPlan' + arrayCommand[1],
                        Priority: 1,
                        Async: 'false',
                        Exten: arrayCommand[2]
                    },
                    function (data) {
                        if (data.Response == 'Error') {
                            socket.emit('errorAMI', 'Cannot originate call!');
                            return;
                        }
                        var emitData = {
                            eventFilter,
                            contentFilter,
                            info: 'Originating call!'
                        }
                        socket.emit('info', emitData);
                    }
                );
            }
            break;
        case 'filter':
            if (arrayCommand.length < 2) {
                socket.emit('errorAMI', 'Missing parameters!');
            } else {
                switch (arrayCommand[1]) {
                    case "event":
                        if (arrayCommand[2]) {
                            eventFilter = arrayCommand[2];
                            var emitData = {
                                eventFilter,
                                contentFilter,
                                info: 'Event filter is set to ' + eventFilter + '. To reset event filter type "filter event all". To reset whole filter, type "filter reset"'
                            }
                            socket.emit('info', emitData);
                        } else {
                            socket.emit('errorAMI', 'Missing parameters!');
                        }
                        break;
                    case "content":
                        if (arrayCommand[2]) {
                            contentFilter = arrayCommand[2];
                            var emitData = {
                                eventFilter,
                                contentFilter,
                                info: 'Content filter is set to ' + contentFilter + '. To reset content filter, type "filter content all". To reset whole filter, type "filter reset"'
                            }
                            socket.emit('info', emitData);
                        } else {
                            socket.emit('errorAMI', 'Missing parameters!');
                        }
                        break;
                    case "reset":
                        eventFilter = "all";
                        contentFilter = "all";
                        var emitData = {
                            eventFilter,
                            contentFilter,
                            info: 'Reset filter! event filter is set to ' + eventFilter + ', content filter is set to ' + contentFilter + '.'
                        }
                        socket.emit('info', emitData);
                        break;
                    default:
                        socket.emit('errorAMI', arrayCommand[1] + ' not found');
                }
            }
            break;
        default:
            socket.emit('errorAMI', arrayCommand[0] + ' not found');
    }
}

module.exports = listener;