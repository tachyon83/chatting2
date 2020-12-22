const mysql = require('mysql');
const dbSetting = require('./models/settings/dbConnectionSettings')
const sqls = require('./models/settings/sqlDispenser')

let rootSettingObj = {
    host: dbSetting.host,
    port: dbSetting.port,
    user: dbSetting.yourLocalMySQLUsername,
    password: dbSetting.yourLocalMySQLPassword,
    multipleStatements: true,
}
let settingObj = {
    host: dbSetting.host,
    port: dbSetting.port,
    user: dbSetting.user,
    password: dbSetting.password,
    multipleStatements: true,
}

function db_initSetting() {
    return new Promise((resolve, reject) => {
        const conn_init1 = mysql.createConnection(rootSettingObj)
        conn_init1.connect();
        conn_init1.query(sqls.initialSetup, (err) => {
            conn_init1.destroy();
            if (err) throw err;
            const conn_init2 = mysql.createConnection(settingObj)
            conn_init2.connect()
            conn_init2.query(sqls.newDB, (err) => {
                conn_init2.destroy();
                if (err) throw err;
                settingObj.database = dbSetting.database
                const conn_init3 = mysql.createConnection(settingObj)
                conn_init3.connect()
                conn_init3.query(sqls.createDummy, (err) => {
                    conn_init3.destroy()
                    if (err) throw err
                    resolve();
                })
            })
        })
    })
}

async function dbSetup() {
    await db_initSetting()
    console.log('DB setup complete!')
}
dbSetup()
