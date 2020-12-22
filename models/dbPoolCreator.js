const mysql = require('mysql');
const dbSetting = require('./settings/dbConnectionSettings')

let settingObj = {
    host: dbSetting.host,
    port: dbSetting.port,
    user: dbSetting.user,
    password: dbSetting.password,
    multipleStatements: true,
    database: dbSetting.database,
    connectionLimit: dbSetting.connectionLimit,
}

module.exports = async () => {
    return await mysql.createPool(settingObj)
}