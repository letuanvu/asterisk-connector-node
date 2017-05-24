
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
    });
    socket.on('makeCall', (data) => {
        if (data && data != "" && data.user && data.caller && data.userExten) {
            ami.action(
                'Originate',
                {
                    Channel: 'SIP/' + data.user,
                    Context: 'DLPN_DialPlan' + data.user,
                    Priority: 1,
                    Async: 'false',
                    Exten: data.caller,
                    CallerID: data.userExten
                },
                function (data) {
                    if (data.Response == 'Error') {
                        socket.emit('apiresult', {success: false, message: 'Cannot originate call!'});
                        return;
                    }
                    socket.emit('apiresult', {success: true, message: 'Originating call!'});
                }
            );
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