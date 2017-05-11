var socket = io();
var result = 'Web command line interface Asterisk ver 1.0';
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

socket.on('greeting', (data) => {
    document.getElementById('result').innerHTML = '<span style="color: blue">' + data + '</span>';
    scrollToBot();
});

socket.on('errorAMI', (data) => {
    result += "<br>" + '<span style="color: red"><b>Error: </b></span> ' + JSON.stringify(data);
    document.getElementById('result').innerHTML = result;
    scrollToBot();
})

socket.on('info', (data) => {
    result += "<br>" + '<span style="color: blue"><b>Event: </b></span> ' + JSON.stringify(data);
    document.getElementById('result').innerHTML = result;
    scrollToBot();
})

socket.on('command', (data) => {
    result += "<br>" + '<span style="color: green"><b>Command: </b></span> ' + JSON.stringify(data);
    document.getElementById('result').innerHTML = result;
    scrollToBot();
})

function scrollToBot() {
    var objDiv = document.getElementById("resultFrame");
    objDiv.scrollTop = objDiv.scrollHeight;
}

document.getElementById('command').onkeypress = function(e){
    if (!e) e = window.event;
    var keyCode = e.keyCode || e.which;
    if (keyCode == '13'){
      socket.emit('command', document.getElementById('command').value, function() {
          document.getElementById('command').value = "";
      });
    }
  }