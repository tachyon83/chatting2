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
const { promisify } = require('util')

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
        console.log('[userController]: reading this socket info...')
        console.log()
        return new Promise((resolve, reject) => {
            redisClient.hget(dataMap.onlineUserHm, socket.userId, (err, user) => {
                if (err) {
                    err.reason = 'dbError'
                    return reject(err)
                }
                console.log(JSON.parse(user))
                return resolve(JSON.parse(user))
            })
        })
    },

    info: id => {
        console.log('[userController]: getting info...')
        console.log()
        return new Promise((resolve, reject) => {
            redisClient.hget(dataMap.onlineUserHm, id, (err, user) => {
                if (err) return reject(err)
                return resolve(JSON.parse(user))
            })
        })
    },

    // already cnt=1 by default as soon as a new group is created.
    createGroup: (socket, groupId) => {
        console.log(`[userController]: ${socket.userId} is creating a New Group with ID(${groupId}).`)
        console.log()
        return new Promise(async (resolve, reject) => {
            try {
                await dao.sqlHandler(sqls.sql_createGroup, groupId)
                socket.groupId = groupId
                redisClient.hget(dataMap.onlineUserHm, socket.userId, (err, user) => {
                    if (err) return reject(err)
                    user = JSON.parse(user)
                    user.groupId = groupId
                    redisClient.hmset(dataMap.onlineUserHm, {
                        [socket.userId]: JSON.stringify(user)
                    })
                    console.log(`[userController]: A New Group with ID(${groupId}) has successfully been created by ${socket.userId}.`)
                    console.log()
                    return resolve(socket)
                })
            } catch (err) {
                if (err.errno === 1062) err.reason = resCode.exist
                else err.reason = resCode.error
                return reject(err)
            }
        })
    },

    // take care of MySQL only
    // need to attack groupId to socket
    joinGroup: (socket, groupId) => {
        console.log(`[userController]: ${socket.userId} is joining a Group with ID(${groupId}).`)
        console.log()
        return new Promise(async (resolve, reject) => {
            socket.groupId = groupId
            redisClient.hget(dataMap.onlineUserHm, socket.userId, (err, user) => {
                if (err) return reject(err)
                user = JSON.parse(user)
                user.groupId = groupId
                redisClient.hmset(dataMap.onlineUserHm, {
                    [socket.userId]: JSON.stringify(user)
                })
                dao.sqlHandler(sqls.sql_incrementCnt, groupId)
                    .then(_ => resolve(socket))
                    .catch(reject)
            })
        })
    },

    disjoinGroup: socket => {
        return new Promise(async (resolve, reject) => {
            redisClient.srem(dataMap.groupIndicator + socket.groupId, socket.userId)
            dao.sqlHandler(sqls.sql_decrementCnt, [socket.groupId, socket.groupId])
                .then(async result => {
                    redisClient.srem(dataMap.groupIndicator + socket.groupId, socket.userId)
                    redisClient.hget(dataMap.onlineUserHm, socket.userId, async (err, user) => {
                        if (err) return reject(err)
                        user = JSON.parse(user)
                        user.groupId = null
                        redisClient.hmset(dataMap.onlineUserHm, {
                            [socket.userId]: JSON.stringify(user)
                        })
                        if (!result[1][0].cnt) {
                            try {
                                await dao.sqlHandler(sqls.sql_removeGroup, socket.groupId)
                                console.log(`[userController]: ${socket.userId} has successfully disjoined a Group with ID(${socket.groupId}).`)
                                console.log()
                                delete socket.groupId
                                resolve()
                            } catch (err) {
                                reject(err)
                            }
                        }
                        else {
                            console.log(`[userController]: ${socket.userId} has successfully disjoined a Group with ID(${socket.groupId}).`)
                            console.log()
                            delete socket.groupId
                            resolve(result)
                        }
                    })
                })
                .catch(reject)
        })
    },

    // socket.join and handle redis(group members, not the onlineUserHm)
    // at this point, socket has socket.groupId
    enterGroup: socket => {
        if (!socket.groupId) return Promise.resolve()
        return new Promise((resolve, reject) => {
            console.log('now adding group info')
            console.log(socket.groupId, socket.userId)
            console.log()
            // redisClient.sadd(dataMap.groupIndicator + socket.groupId, socket.userId)
            redisClient.sadd(dataMap.groupIndicator + socket.groupId, socket.userId)
            try {
                socket.join(socket.groupId)
                console.log(`[userController]: ${socket.userId} has successfully entered a Group with ID(${socket.groupId}).`)
                console.log()
                resolve()
            } catch (err) {
                console.log('err while joining group', err)
                reject(err)
            }
        })
    },

    listInRoom: socket => {
        console.log(`[userController]: ${socket.userId} is asking for list in his Room with ID(${socket.pos}).`)
        console.log()
        return new Promise((resolve, reject) => {
            redisClient.smembers(socket.pos, async (err, list) => {
                if (err) return reject(err)
                // let result = []
                // const hgetAsync = promisify(redisClient.hget).bind(redisClient)
                // for (let p of list) {
                //     try {
                //         result.push(await hgetAsync(dataMap.onlineUserHm, p))
                //     } catch (err) {
                //         return reject(err)
                //     }
                // }
                resolve(list)
            })
        })
    },

    listInLobby: _ => {
        console.log(`[userController]: getting user list in Lobby.`)
        console.log()
        return new Promise((resolve, reject) => {
            redisClient.smembers(dataMap.lobby, async (err, list) => {
                if (err) return reject(err)
                // let result = []
                // const hgetAsync = promisify(redisClient.hget).bind(redisClient)
                // for (let p of list) {
                //     try {
                //         result.push(await hgetAsync(dataMap.onlineUserHm, p))
                //     } catch (err) {
                //         return reject(err)
                //     }
                // }
                resolve(list)
            })
        })
    },

}