const socketIO = require('socket.io');
const createStream = require('./IOstream.js');
const configPBXservers = require('../../config.js').configPBXservers;
const aio = require('asterisk.io');
const FormData = require('form-data');
const request = require('request');
const mysql = require('mysql2');

function createWebSocket(server) {
    //tao 1 object io
    var io = socketIO(server);
    //loop qua tat ca cac config cua cac server pbx va crm
    var AMIservers = configPBXservers.map(configPBX => {

        return {
            namespace: configPBX.company,
            crmurl: configPBX.crmurl,
            dbconnection: mysql.createConnection(configPBX.db), //tao ket noi toi sql cua crm trong config
            server: aio.ami( //tao ket noi den PBX qua AMI
                configPBX.asterisk.ASTERISK_SERVER_IP,
                configPBX.asterisk.ASTERISK_SERVER_PORT,
                configPBX.asterisk.ASTERISK_USERNAME,
                configPBX.asterisk.ASTERISK_PASSWORD
            )
        };
    });
    AMIservers.forEach(function (AMI) {
        //lang nghe su kien ready tu server PBX qua AMI
        AMI.server.on('ready', function () {
            console.log(AMI.namespace, "is ready to connect");
            //tao 1 namespace trong socket, phuong thuc use() cho phep dinh 1 middleware vao socket
            io.of('/' + AMI.namespace).use(function (socket, next) {
                var handshakeData = socket.request;
                if (handshakeData._query.token) {
                    //chung thuc session id va csrf cua crm
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
                            //khong the ket noi den crm, khong cho ket noi den namespace
                            next(new Error('Cannot connect to vtiger crm'));
                        } else {
                            if (body == 'Invalid request' || body.indexOf('undefined') === 1 || !body) {
                                //session id va crsf ko phu hop, khong cho ket noi den namespace
                                next(new Error('Not authorized'));
                            } else if (JSON.parse(body).success) {
                                //xac thuc thanh cong, cho ket noi den namespace
                                next();
                            } else {
                                //session id va crsf ko phu hop, khong cho ket noi den namespace
                                next(new Error('Not authorized'));
                            }
                        }
                    });
                } else {
                    //khong co token, ko cho ket noi den namespace
                    next(new Error('not authorized'));
                }
            });
            //lang nghe su kien connection tren namespace
            io.of('/' + AMI.namespace).on('connection', (socket) => {
                console.log('new connection');
                //tao emitrer va listener
                createStream(socket, AMI.server, AMI.dbconnection);
            });

            //lang nghe tat ca su kien tu AMI cua pbx
            AMI.server.on('eventAny', function (data) {
                var dbconnection = AMI.dbconnection;
                //neu su kien la Cdr
                if (data.Event == 'Cdr') {
                    var sourceNum = data.Source || data.CallerID.split('/')[0];//so dien thoai goi di
                    console.log('pbx call:', sourceNum, data.Destination);
                    //tim kiem so goi di trong bang user cua crm
                    dbconnection.execute('SELECT id, phone_crm_extension FROM vtiger_users WHERE phone_crm_extension=? OR phone_crm_extension=?', [sourceNum, data.Destination], function (err, results, fields) {
                        console.log('length:', results.length)
                        if (!err && results.length > 0) { //neu ton tai user
                            var userId = results[0].id; //lay user id
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
                                //tim id tiep theo trong bang entity cua crm
                                dbconnection.execute('SELECT MAX(crmid) AS latestId FROM `vtiger_crmentity`', function (errS1, resultsS1, fieldsS1) {
                                    if (!errS1) {
                                        var nextId = resultsS1[0].latestId + 1;
                                        console.log('next entity id:', nextId);
                                        //insert vao bang entity
                                        dbconnection.execute('INSERT INTO vtiger_crmentity (crmid,smcreatorid,smownerid,modifiedby,setype,description,createdtime,modifiedtime,viewedtime,status,version,presence,deleted,label,source,smgroupid) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                                            [nextId, 1, 1, 0, "PBXManager", "", data.StartTime, data.StartTime, null, null, 0, 1, 0, customernumber, "CRM", 0], function (errI1, resultsI1, fieldsI1) {
                                                if (!errI1) {
                                                    console.log('inserted entity id:', nextId);
                                                    //cap nhat bang entity_seq
                                                    dbconnection.execute('UPDATE vtiger_crmentity_seq SET id=?', [nextId], function (errU1, resultsU1, fieldsU1) {
                                                        if (!errU1) {
                                                            console.log('updated sequence entity');
                                                        } else {
                                                            console.log('ERROR when updated sequence entity');
                                                        }
                                                    });
                                                    //insert vao bang pbxmanager
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

                //luu file ghi am
                if (data.Event == 'End MixMonitorCall') {
                    var source = data['Source Number'];
                    var destination = data['Destination Number'];
                    var dirArr = data.File.split('/');
                    var filenameArr = dirArr[5].split('-');
                    var dateString = filenameArr[0];

                    //function update pbxmanager va them vao duong dan file ghi am
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

                    //function cho phep chay 1 function sau 1 thoi gian
                    var asyncSaveRecord = (params, callback) => {
                        setTimeout(() => {
                            callback(params);
                        }, 10000);
                    };

                    //sau 10s chay function doSaveRecord()
                    asyncSaveRecord([dateString, destination, source], doSaveRecord);
                }
            });
        });
    });
}
module.exports = createWebSocket;