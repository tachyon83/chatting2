const mysql = require('mysql');
const SQLDispenser = require('./sqlDispenser');

/*
    check the following settings
*/
/////////////////////////////////////////////////////////////////////////// 

const yourLocalMySQLUsername = 'root2';
const yourLocalMySQLPassword = '1234';
const hostname = 'localhost';
const portnumber = 3306;
const connLimit = 30;
const mySQLusername = "chatmanager";
const mySQLpassword = "1234";
const mySQLdbname = "chatdb";
const mySQLtablename = "usertable";

///////////////////////////////////////////////////////////////////////////

const sqlDispenser = new SQLDispenser(mySQLusername, mySQLpassword, mySQLdbname, mySQLtablename);
const sqls1 = sqlDispenser.popCreateUserSQLs();
const sql_createDB = sqlDispenser.popCreateDBSQL();
var sqls2 = "";
sqls2 += sqlDispenser.popCreateTableSQL('pID', ['pID varchar(20) not null', 'pPW varchar(20) not null']);
sqls2 += sqlDispenser.popInsertValuesSQL(['pID', "'tom'"], "'tom'", "'111'");
sqls2 += sqlDispenser.popInsertValuesSQL(['pID', "'paul'"], "'paul'", "'111'");

///////////////////////////////////////////////////////////////////////////

const conn1Setting = {
    host: hostname,
    port: portnumber,
    user: yourLocalMySQLUsername,
    password: yourLocalMySQLPassword,
    multipleStatements: true,
}
const conn2Setting = {
    host: hostname,
    port: portnumber,
    user: sqlDispenser.username,
    password: sqlDispenser.password,
    multipleStatements: true,
}
const conn3Setting = {
    host: hostname,
    port: portnumber,
    user: sqlDispenser.username,
    password: sqlDispenser.password,
    database: sqlDispenser.dbname,
    multipleStatements: true,
}
const connFinalSetting = {
    host: hostname,
    port: portnumber,
    user: sqlDispenser.username,
    password: sqlDispenser.password,
    database: sqlDispenser.dbname,
    multipleStatements: true,
    connectionLimit: connLimit,
}

function db_initSetting() {
    return new Promise((resolve, reject) => {
        const conn_init1 = mysql.createConnection(conn1Setting);
        conn_init1.connect();
        conn_init1.query(sqls1, (err) => {
            conn_init1.destroy();
            if (err) {
                throw err;
                return;
            }
            const conn_init2 = mysql.createConnection(conn2Setting)
            conn_init2.connect()
            conn_init2.query(sql_createDB, (err) => {
                conn_init2.destroy();
                if (err) {
                    throw err;
                    return;
                }
                const conn_init3 = mysql.createConnection(conn3Setting)
                conn_init3.connect()
                conn_init3.query(sqls2, (err) => {
                    conn_init3.destroy()
                    if (err) {
                        reject(err)
                    }
                    resolve();
                })
            })
        })
    })
}

var dbpool = null;
async function dbpoolCreater() {
    await db_initSetting();
    dbpool = mysql.createPool(connFinalSetting)
}
dbpoolCreater();

// const sql_comparePW = "select pPW from usertable where pID= ?;"
// function sqlHandler(id, pw) {
//     return new Promise((resolve, reject) => {
//         dbpool.getConnection((err, conn) => {
//             if (err) {
//                 if (conn) conn.release();
//                 console.log('ERR: getConnection in sqlHandler');
//                 return;
//             }
//             conn.query(sql_comparePW, [id], (error, rows, fields) => {
//                 if (error) {
//                     if (conn) conn.release();
//                     reject(error);
//                     return;
//                 }
//                 var ret = false;
//                 // if (rows[0].pPW == pw) ret = rows[0];
//                 if (rows[0].pPW == pw) ret = true;
//                 resolve(ret);
//             })
//         })
//     })
// }
// async function pwChecker(id, pw) {
//     return await sqlHandler(id, pw);
// }

// const sql_compareID = "select count(*) from usertable where pID= ?;"
const sql_compareID = "select * from usertable where pID= ?;"
function sqlHandler2(id, pw) {
    return new Promise((resolve, reject) => {
        dbpool.getConnection((err, conn) => {
            if (err) {
                if (conn) conn.release();
                console.log('ERR: getConnection in sqlHandler2');
                return;
            }
            conn.query(sql_compareID, [id], (error, rows, fields) => {
                if (error) {
                    if (conn) conn.release();
                    reject(error);
                    return;
                }
                var ret = false;
                if (rows) ret = rows[0];
                resolve(ret);
            })
        })
    })
}
async function idChecker(id, pw) {
    return await sqlHandler2(id, pw);
}

// 리턴에 따라서 sqlHandler분할
// boolean / JSON

module.exports = class DAO {
    constructor() { }

    // matchPassword = async function (id, pw, cb) {
    //     if (await pwChecker(id, pw)) cb(null, { pID: id });
    //     else cb('wrong pw', false);
    // }

    findById = async function (id, cb) {
        let user = await idChecker(id);
        if (user) cb(null, user);
        else cb(null, null);
    }
}
