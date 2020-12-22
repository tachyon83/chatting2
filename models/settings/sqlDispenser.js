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
        nick varchar(50) not null,
        img varchar(500),
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

let sqls2 = sql_createTable_user +
    sql_createTable_friendlist

let sql_signup =
    `insert into ${dbSetting.table_user} values(?,?,?,?);`

let sql_findByEmail =
    `select * from ${dbSetting.table_user} where email=? limit 1;`

let sql_existById =
    `select count(*) as cnt from ${dbSetting.table_user} where id=?;`
let sql_findById =
    `select * from ${dbSetting.table_user} where id=? limit 1;`

let sql_create =
    `insert into ${dbSetting.tablename}(poolName,poolAddress,
    poolPhone,poolTypeMask,poolOpentime,poolOption) 
    select * from (select ? as poolName,? as poolAddress,
    ? as poolPhone,? as poolTypeMask,? as poolOpentime,? 
    as poolOption) as tmp where not exists(select poolName 
    from ${dbSetting.tablename} where poolName = ?) limit 1;`
let sql_detail =
    `select * from pooltable where poolId=?;`

let sql_select_totalCount =
    `select count(*) as cnt from ${dbSetting.tablename} 
    where (poolName like ? or poolAddress like ?) 
    and (poolTypeMask&?)=poolTypeMask and 
    (poolOpentime&?)=? and (poolOption&?)=?;`
let sql_select =
    `select * from ${dbSetting.tablename} 
    where (poolName like ? or poolAddress like ?) 
    and (poolTypeMask&?)=poolTypeMask and 
    (poolOpentime&?)=? and (poolOption&?)=? 
    order by poolId limit ?,?;`

let sql_delete =
    `delete from ${dbSetting.tablename} where poolId = ?;`

let sql_update =
    `update ${dbSetting.tablename} set poolName=?,
    poolAddress=?,poolPhone=?,poolTypeMask=?,poolOpentime=?,
    poolOption=? where poolId = ?;`

let sql_adminBoard =
    `select count(*) from ${dbSetting.tablename} union all
    select count(*) from ${dbSetting.tablename} where 16&poolTypeMask=16 union all
    select count(*) from ${dbSetting.tablename} where 8&poolTypeMask=8 union all
    select count(*) from ${dbSetting.tablename} where 4&poolTypeMask=4 union all
    select count(*) from ${dbSetting.tablename} where 2&poolTypeMask=2 union all
    select count(*) from ${dbSetting.tablename} where 1&poolTypeMask=1 union all
    select count(*) from ${dbSetting.tablename} where 4&poolOption=4 union all
    select count(*) from ${dbSetting.tablename} where 2&poolOption=2 union all
    select count(*) from ${dbSetting.tablename} where 1&poolOption=1;`

module.exports = {
    initialSetup: sqls1,
    newDB: sql_createDB,
    createDummy: sqls2,
    // sql_create: sql_create,
    // sql_detail: sql_detail,
    // sql_select_totalCount: sql_select_totalCount,
    // sql_select: sql_select,
    // sql_adminBoard: sql_adminBoard,
    // sql_delete: sql_delete,
    // sql_update: sql_update,
    // sql_findByEmail,
    sql_existById,
    // sql_register,
    sql_signup,
    sql_findById,
}