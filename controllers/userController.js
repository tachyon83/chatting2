// db access
// can handle socket emission sometimes

// redis,mysql,socket key (socket.group)
// groupIndicator를 붙여서 등록(redis)
// createGroup: mysql(group), socket.group, redis(user)
// enterGroup: mysql(X), redis(group), socket join
// joinGroup: mysql(group) cnt++, socket.group, redis(user)
// disjoinGroup: mysql(group) cnt--,mysql(group) remove if(!cnt), delete socket.group, redis(user),redis(group)
// join: cnt++, disjoin: cnt-- if(!cnt)delete
// logout시에 유저(+그룹) 정보 업데이트

// create-enter , join-enter , disjoin-leave
// 로그아웃 시에는 소켓 그룹 나가기를 따로 수행하지 않는다


const resCode = require('../config/resCode')
const redisClient = require('../config/redisClient');
const dataMap = require('../config/dataMap');
const dao = require('../models/userDao')
const sqls = require('../models/settings/sqlDispenser')

module.exports = {
    update: (socket, nick) => {
        return new Promise((resolve, reject) => {
            redisClient.hget(dataMap.onlineUserHm, socket.userId, (err, user) => {
                if (err) {
                    err.reason = 'dbError'
                    return reject(err)
                }
                user = JSON.parse(user)
                user.nick = nick
                redisClient.hmset(onlineUserHm, {
                    [socket.userId]: JSON.stringify(user)
                })
                resolve(true)
            })
        })
    },

    read: socket => {
        return new Promise((resolve, reject) => {
            redisClient.hget(dataMap.onlineUserHm, socket.userId, (err, user) => {
                if (err) {
                    err.reason = 'dbError'
                    return reject(err)
                }
                let refinedUser = JSON.parse(user)
                delete refinedUser.id
                delete refinedUser.password
                return resolve(refinedUser)
            })
        })
    },

    createGroup: (socket, groupId) => {
        return new Promise(async (resolve, reject) => {
            try {
                await dao.sqlHandler(sqls.sql_createGroup, groupId)
                socket.group = groupId
                redisClient.hget(dataMap.onlineUserHm, socket.userId, (err, user) => {
                    if (err) return reject(err)
                    user = JSON.parse(user)
                    user.groupId = groupId
                    redisClient.hmset(dataMap.onlineUserHm, {
                        [socket.userId]: JSON.stringify(user)
                    })
                    return resolve()
                })
            } catch (err) {
                if (err.errno === 1062) err.reason = resCode.exist
                else err.reason = resCode.error
                return reject(err)
            }
        })
    },

    joinGroup: (socket, groupId) => {
        return new Promise(async (resolve, reject) => {
            dao.sqlHandler(sqls.sql_incrementCnt, groupId)
                .then(resolve)
                .catch(reject)
        })
    },

    disjoinGroup: (socket, groupId) => {
        return new Promise(async (resolve, reject) => {
            dao.sqlHandler(sqls.sql_decrementCnt, [groupId, groupId])
                .then(async result => {
                    delete socket.groupId
                    redisClient.srem(dataMap.groupIndicator + socket.groupId, socket.userId)
                    redisClient.hget(dataMap.onlineUserHm, socket.userId, (err, user) => {
                        if (err) return reject(err)
                        user = JSON.parse(user)
                        user.groupId = null
                        redisClient.hmset(dataMap.onlineUserHm, {
                            [socket.userId]: JSON.stringify(user)
                        })
                        if (!result[1][0].cnt) {
                            try {
                                await dao.sqlHandler(sqls.sql_removeGroup, groupId)
                                resolve()
                            } catch (err) {
                                reject(err)
                            }
                        }
                        else resolve(result)
                    })
                })
                .catch(reject)
        })
    },

    enterGroup: socket => {
        if (!socket.groupId) return Promise.resolve()
        return new Promise((resolve, reject) => {
            socket.join(socket.groupId)
            redisClient.sadd(dataMap.groupIndicator + socket.groupId, socket.userId)
            resolve()
        })
    },


}