const config = {
    ASTERISK_SERVER_IP: '192.168.100.3',
    ASTERISK_SERVER_PORT: 5038,
    ASTERISK_USERNAME: 'admin',
    ASTERISK_PASSWORD: 'password',
}

const configFTP = {
    host: '192.168.100.3',
    port: 21,
    user: 'root',
    password: 'ys123456'
}

module.exports.generalConfig = config;
module.exports.configFTP = configFTP;