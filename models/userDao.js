const mysql = require('mysql');
const dbCreate = require('./dbPoolCreator')
const sqls = require('./settings/sqlDispenser')

class Dao {
    constructor() {
        dbCreate().then(pool => {
            this.dbpool = pool
            console.log('Dao class instance and its dbPool created...')
        })
        // this.usedIds=[]
    }

    // arrow function is needed to have an access to this.dbpool
    // because in class, written in 'strict mode'

    sqlHandler = (sql, q, fn) => {
        if (q) sql = mysql.format(sql, q)
        return new Promise((resolve, reject) => {
            this.dbpool.getConnection((err, conn) => {
                if (err) {
                    if (conn) conn.release();
                    reject(err)
                    return;
                }
                conn.query(sql, (err, rows, fields) => {
                    conn.release();
                    if (err) {
                        reject(err)
                        return;
                    }
                    // console.log('db process result', rows)
                    resolve(rows)
                })
            })
        })
    }

    existById = (id, fn) => {
        console.log('id in exist', id)
        this.sqlHandler(sqls.sql_existById, id, fn).then(res => {
            console.log(res[0].cnt)
            if (res[0].cnt > 0) return fn(null, false)
            fn(null, true)
        }).catch(err => {
            fn(err, null)
        })
    }
    findById = (id, fn) => {
        this.sqlHandler(sqls.sql_findById, id, fn).then(res => {
            if (res) return fn(null, res[0])
            fn(null, false)
        }).catch(err => {
            fn(err, null)
        })
    }

    signup = (q, fn) => {
        let info = [
            q.id,
            q.password,
            q.nick,
            q.img,
        ]
        this.sqlHandler(sqls.sql_signup, info, fn).then(res => {
            return fn(null, true)
        }).catch(err => {
            fn(err, null)
        })
    }
}

module.exports = new Dao()