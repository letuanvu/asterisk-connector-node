const ConnectorURL = 'http://localhost:3000';
const configPBXservers = [{
    company: 'ASK',
    crm: {
        auth: {
            VT_URL: 'http://localhost/crm-ask',
            VT_USER: 'admin',
            VT_ACCESSKEY: 'NmekXjHCmQsNvwtV', // accesskey is in your vtiger user preferences
            LOGGING_LEVEL: 'warning',   // level of logging (error||warning||info||debug||trace)
        },
        customers: {
            moduleName: 'Contacts',
            phoneFields: ['phone', 'mobile'],
        },
    },
    asterisk: {
        ASTERISK_SERVER_IP: 'ip_ASTERISK',
        ASTERISK_SERVER_PORT: 'port_ASTERISK',
        ASTERISK_USERNAME: 'admin',
        ASTERISK_PASSWORD: 'password',
    },
    ftp: {
        host: 'ip_ftp_ASTERISK',
        port: 21,
        user: 'user',
        password: 'passwordftp'
    }
}];

module.exports.connectorURL = ConnectorURL;
module.exports.configPBXservers = configPBXservers;