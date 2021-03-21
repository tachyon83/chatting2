const dbSetting = require('./dbConnectionSettings')

// '%' vs 'localhost'

let sql_createUser =
    `create user if not exists ${dbSetting.user}
    identified by '${dbSetting.password}';`;
let sql_grantPrivileges =
    `grant all privileges on ${dbSetting.database}.* 
    to '${dbSetting.user}'@'%';`;
let sql_flush =
    `flush privileges;`;
let sql_alterUser =
    `alter user ${dbSetting.user} 
    identified with mysql_native_password 
    by '${dbSetting.password}';`;
let sqls1 = sql_createUser + sql_grantPrivileges + sql_flush + sql_alterUser;

let sql_createDB =
    `create database if not exists ${dbSetting.database};`;

let sql_createTable_user =
    `create table if not exists
    ${dbSetting.table_user}(
        id varchar(30) not null,
        password varchar(150) not null,
        nick varchar(50),
        img varchar(500),
        groupId varchar(36),
        primary key(id),
        foreign key(groupId) 
        references ${dbSetting.table_group}(id) 
        on update cascade 
    );`
// on delete cascade

let sql_createTable_group =
    `create table if not exists 
    ${dbSetting.table_group}(
        id varchar(30) not null,
        cnt int not null default 1,
        primary key(id)
    );`

let sql_createTable_friendlist =
    `create table if not exists
    ${dbSetting.table_friendlist}(
        userid varchar(30) not null,
        friendid varchar(30) not null,
        foreign key(userid)
        references ${dbSetting.table_user}(id)
        on delete cascade
        on update cascade
    );`

let sqls2 = sql_createTable_group +
    sql_createTable_user +
    sql_createTable_friendlist

let sql_signup =
    `insert into ${dbSetting.table_user}(id,password,img) values(?,?,?);`

let sql_existById =
    `select count(*) as cnt from ${dbSetting.table_user} where id=?;`

let sql_findById =
    `select * from ${dbSetting.table_user} where id=? limit 1;`

let sql_createGroup =
    `insert into ${dbSetting.table_group}(id) values(?)`

let sql_getCntInGroup =
    `select cnt from ${dbSetting.table_group} where id=?;`

let sql_removeGroup =
    `delete from ${dbSetting.table_group} where id=?;`

let sql_updateUserUponLogout =
    // `update ${dbSetting.table_user} set img=?,groupId=? where id=?;`
    `update ${dbSetting.table_user} set groupId=? where id=?;`

let sql_incrementCnt =
    `update ${dbSetting.table_group} set cnt=cnt+1 where id=?;`

let sql_decrementCnt =
    `update ${dbSetting.table_group} set cnt=cnt-1 where id=?;
    select cnt from ${dbSetting.table_group} where id=?;`

module.exports = {
    initialSetup: sqls1,
    newDB: sql_createDB,
    createDummy: sqls2,
    sql_existById,
    sql_signup,
    sql_findById,
    sql_createGroup,
    sql_getCntInGroup,
    sql_removeGroup,
    sql_updateUserUponLogout,
    sql_incrementCnt,
    sql_decrementCnt,

}