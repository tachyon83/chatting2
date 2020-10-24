/*
    takes 4 arguments at first
    need table description
    A string needs ' ' around it for some cases.
*/

// module.exports = function (username, password, dbname, tablename) {
module.exports = class SQLDispenser {
    constructor(username, password, dbname, tablename) {
        this.username = username;
        this.password = password;
        this.dbname = dbname;
        this.tablename = tablename;
        this.tablecolumns = [];
    }
    popConnectionSetting() {

    }

    popCreateUserSQLs() {
        const sql_createUser = "create user if not exists " + this.username + " identified by " + "'" + this.password + "';";
        const sql_grantPrivileges = "grant all privileges on " + this.dbname + ".* to '" + this.username + "'@'%';";
        const sql_flush = "flush privileges;";
        const sql_alterUser = "alter user " + this.username + " identified with mysql_native_password by '" + this.password + "';";
        return sql_createUser + sql_grantPrivileges + sql_flush + sql_alterUser;
    }

    popCreateDBSQL() {
        return "create database if not exists " + this.dbname + ";";
    }

    popCreateTableSQL(primaryKey, columnInfo) {

        // syntax: example.popCreateTableSQL([ [num,int,not null],[name,varchar(20)], ...],num)

        let sql_createTable = "create table if not exists " + this.tablename + "(";
        for (let column of columnInfo) this.tablecolumns.push(column.split(" ")[0])
        sql_createTable += columnInfo.join(',');
        sql_createTable += ",primary key(" + primaryKey + "));";
        return sql_createTable;
    }

    popInsertValuesSQL(keyPair, ...values) {

        // if keyPair[1] is a string, then have to add ' ' around it (need to check)

        let sql_insertValues = "insert into " + this.tablename + "(";
        sql_insertValues += this.tablecolumns.join(',') + ") select * from (select ";
        for (let i in values) {
            sql_insertValues += values[i] + " as " + this.tablecolumns[i];
            if (i < values.length - 1) sql_insertValues += ","
        }
        sql_insertValues += ") as tmp where not exists(select * from " + this.tablename + " where " + keyPair[0] + " = " + keyPair[1] + ") limit 1;";
        return sql_insertValues;
    }
}

