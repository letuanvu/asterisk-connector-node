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
                socket.emit('info', 'Excuting command ' + command);
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
                        socket.emit('info', 'Originating call!');
                    }
                );
            }
            break;
        default:
            socket.emit('errorAMI', arrayCommand[0] + ' not found');
    }
}

module.exports = listener;