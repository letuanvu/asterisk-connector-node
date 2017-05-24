const socketIO = require('socket.io');
const createStream = require('./IOstream.js');
const configPBXservers = require('../../config.js').configPBXservers;
const aio = require('asterisk.io');
const FormData = require('form-data');
const request = require('request');
const mysql = require('mysql2');

function createWebSocket(server) {
    var io = socketIO(server);

    var AMIservers = configPBXservers.map(configPBX => {

        return {
            namespace: configPBX.company,
            crmurl: configPBX.crmurl,
            dbconnection: mysql.createConnection(configPBX.db),
            server: aio.ami(
                configPBX.asterisk.ASTERISK_SERVER_IP,
                configPBX.asterisk.ASTERISK_SERVER_PORT,
                configPBX.asterisk.ASTERISK_USERNAME,
                configPBX.asterisk.ASTERISK_PASSWORD
            )
        };
    });
    AMIservers.forEach(function (AMI) {
        // AMI.dbconnection.query('SELECT * FROM `vtiger_crmentity`', function (err, results, fields) {
        //     console.log(results); // results contains rows returned by server
        //     console.log(fields); // fields contains extra meta data about results, if available
        // });
        AMI.server.on('ready', function () {
            console.log(AMI.namespace, "is ready to connect");
            io.of('/' + AMI.namespace).use(function (socket, next) {
                var handshakeData = socket.request;
                if (handshakeData._query.token) {
                    var formData = {
                        module: 'PBXManager',
                        action: 'PBXauth',
                        __vtrftk: handshakeData._query.token
                    }
                    request.post({
                        url: AMI.crmurl + '/index.php',
                        headers: {
                            'cookie': handshakeData._query.cookie
                        },
                        formData: formData
                    }, (err, res, body) => {
                        console.log(body)
                        if (err) {
                            next(new Error('Cannot connect to vtiger crm'));
                        } else {
                            if (body == 'Invalid request' || body.indexOf('undefined') === 1 || !body) {
                                next(new Error('Not authorized'));
                            } else if (JSON.parse(body).success) {
                                next();
                            } else {
                                next(new Error('Not authorized'));
                            }
                        }
                    });
                } else {
                    next(new Error('not authorized'));
                }
            });
            io.of('/' + AMI.namespace).on('connection', (socket) => {
                console.log('new connection');

                createStream(socket, AMI.server, AMI.dbconnection);
            });
            AMI.server.on('eventAny', function (data) {

                var dbconnection = AMI.dbconnection;
                if (data.Event == 'Cdr') {
                    var sourceNum = data.Source || data.CallerID.split('/')[0];
                    console.log('pbx call:', sourceNum, data.Destination);
                    dbconnection.execute('SELECT id, phone_crm_extension FROM vtiger_users WHERE phone_crm_extension=? OR phone_crm_extension=?', [sourceNum, data.Destination], function (err, results, fields) {
                        console.log('length:', results.length)
                        if (!err && results.length > 0) {
                            var userId = results[0].id;
                            if (userId) {
                                console.log('crm user got call:', sourceNum, data.Destination)
                                var startTime = '';
                                if (data.AnswerTime) {
                                    startTime = data.AnswerTime;
                                } else {
                                    startTime = data.StartTime;
                                }
                                var customernumber = '';
                                if (results[0].phone_crm_extension == sourceNum) {
                                    customernumber = data.Destination;
                                } else {
                                    customernumber = sourceNum;
                                }
                                dbconnection.execute('SELECT MAX(crmid) AS latestId FROM `vtiger_crmentity`', function (errS1, resultsS1, fieldsS1) {
                                    if (!errS1) {
                                        var nextId = resultsS1[0].latestId + 1;
                                        console.log('next entity id:', nextId);
                                        dbconnection.execute('INSERT INTO vtiger_crmentity (crmid,smcreatorid,smownerid,modifiedby,setype,description,createdtime,modifiedtime,viewedtime,status,version,presence,deleted,label,source,smgroupid) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                                            [nextId, 1, 1, 0, "PBXManager", "", data.StartTime, data.StartTime, null, null, 0, 1, 0, customernumber, "CRM", 0], function (errI1, resultsI1, fieldsI1) {
                                                if (!errI1) {
                                                    console.log('inserted entity id:', nextId);
                                                    dbconnection.execute('UPDATE vtiger_crmentity_seq SET id=?', [nextId], function (errU1, resultsU1, fieldsU1) {
                                                        if (!errU1) {
                                                            console.log('updated sequence entity');
                                                        } else {
                                                            console.log('ERROR when updated sequence entity');
                                                        }
                                                    });
                                                    dbconnection.execute('INSERT INTO vtiger_pbxmanager (pbxmanagerid, direction, callstatus, starttime, endtime, totalduration, billduration, gateway, user, customernumber, customer) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
                                                        [nextId, data.UserField, 'incompleted', startTime, data.EndTime, data.Duration, data.BillableSeconds, 'Node Connector', userId, customernumber, +data.CallerID.split('/')[1] || null], function (errI2, resultsI2, fieldsI2) {
                                                            if (!errI2) {
                                                                console.log('inserted into vtiger_pbxmanage', nextId);
                                                            } else {
                                                                console.log('ERROR when inserted into vtiger_pbxmanage', nextId);
                                                            }
                                                        });
                                                } else {
                                                    console.log('ERROR when inserted entity id:', nextId, errI1);
                                                }
                                            });
                                    } else {
                                        console.log('ERROR when select next entity id:', nextId, errS1);
                                    }
                                });
                            }
                        }
                    });

                }
                if (data.Event == 'End MixMonitorCall') {
                    var source = data['Source Number'];
                    var destination = data['Destination Number'];
                    var dirArr = data.File.split('/');
                    var filenameArr = dirArr[5].split('-');
                    var dateString = filenameArr[0];
                    function doSaveRecord(params) {
                        dbconnection.execute("SELECT pbxmanagerid FROM vtiger_pbxmanager WHERE DATE_FORMAT(starttime, '%Y%m%d%H%i%s')=? AND (customernumber = ? OR customernumber =?)",
                            [...params], function (err, results, fields) {
                                if (results.length > 0)
                                    dbconnection.execute('UPDATE vtiger_pbxmanager SET recordingurl=?, callstatus=? WHERE pbxmanagerid=?',
                                        [dirArr[4] + '/' + dirArr[5], 'completed', results[0].pbxmanagerid], function (errU, resultsU, fieldsU) {
                                            if (!errU) {
                                                console.log('added call record URL successfully');
                                            } else {
                                                console.log('ERROR when added call record URL');
                                            }
                                        });
                            })
                    };
                    var asyncSaveRecord = (params, callback) => {
                        setTimeout(() => {
                            callback(params);
                        }, 10000);
                    };
                    asyncSaveRecord([dateString, destination, source], doSaveRecord);
                }
            });
        });
    });
}
module.exports = createWebSocket;