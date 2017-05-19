const _ = require('lodash');

function emitter(ami, socket, dbconnection) {
    ami.on('error', function (err) {
        socket.emit('errorAMI', 'Có lỗi xảy ra! Vui lòng thử lại.');
    });
    console.log('ready');
    ami.on('eventAny', function (data) {
        socket.emit('info', data);
        if (data.Event == 'Cdr') {
            dbconnection.execute('SELECT MAX(crmid) AS latestId FROM `vtiger_crmentity`', function (err, results, fields) {
                var nextId = results[0].latestId + 1; // results contains rows returned by server
                dbconnection.execute('INSERT INTO vtiger_crmentity (crmid,smcreatorid,smownerid,modifiedby,setype,description,createdtime,modifiedtime,viewedtime,status,version,presence,deleted,label,source,smgroupid) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                [nextId, 1, 1, 0, "PBXManager", "", data.StartTime, data.StartTime, null, null, 0, 1, 0, data.Destination, "CRM", 0], function (err, results, fields) {

                });
            });
        }
    });

}

module.exports = emitter;