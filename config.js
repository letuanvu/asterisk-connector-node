const configPBXservers = [{
    company: 'ASK',
    crmurl: 'http://192.168.100.136/vtigercrm7',
    db: {
        host: '192.168.100.41',
        port: '3306',
        user: 'root',
        password: 'root',
        database: 'vtigercrm7',
    },
    asterisk: {
        ASTERISK_SERVER_IP: '192.168.100.3',
        ASTERISK_SERVER_PORT: 5038,
        ASTERISK_USERNAME: 'admin',
        ASTERISK_PASSWORD: 'password',
    },
    ftp: {
        host: '192.168.100.3',
        port: 21,
        user: 'root',
        password: 'ys123456'
    }

}]


module.exports.configPBXservers = configPBXservers;