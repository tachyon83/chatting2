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
const redisHandler = require('../config/redisHandler');
const dataMap = require('../config/dataMap');
const dao = require('../models/userDao')
const sqls = require('../models/settings/sqlDispenser')
const eventEmitter = require('../config/eventEmitter')

module.exports = {
    update: (socket, nick) => {
        return new Promise(async (resolve, reject) => {
            try {
                let user = await redisHandler.hget(dataMap.onlineUserHm, socket.userId)
                user = JSON.parse(user)
                user.nick = nick
                redisHandler.hmset(onlineUserHm, {
                    [socket.userId]: JSON.stringify(user)
                })
                resolve(true)
            } catch (err) {
                err.reason = 'dbError'
                return reject(err)
            }
        })
    },

    read: socket => {
        console.log('[userController]: reading this socket info...')
        console.log()
        return new Promise(async (resolve, reject) => {
            try {
                let user = await redisHandler.hget(dataMap.onlineUserHm, socket.userId)
                return resolve(JSON.parse(user))
            } catch (err) {
                err.reason = 'dbError'
                return reject(err)
            }
        })
    },

    info: id => {
        console.log('[userController]: getting info...')
        console.log()
        return new Promise(async (resolve, reject) => {
            try {
                let user = await redisHandler.hget(dataMap.onlineUserHm, id)
                return resolve(JSON.parse(user))
            } catch (err) {
                return reject(err)
            }
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
                let user = await redisHandler.hget(dataMap.onlineUserHm, socket.userId)
                user = JSON.parse(user)
                user.groupId = groupId
                redisHandler.hmset(dataMap.onlineUserHm, {
                    [socket.userId]: JSON.stringify(user)
                })
                console.log(`[userController]: A New Group with ID(${groupId}) has successfully been created by ${socket.userId}.`)
                console.log()
                return resolve(socket)
            } catch (err) {
                if (err.errno && err.errno === 1062) err.reason = resCode.exist
                else err.reason = resCode.error
                return reject(err)
            }
        })
    },

    // take care of MySQL only
    // need to attach groupId to socket
    joinGroup: (socket, groupId) => {
        console.log(`[userController]: ${socket.userId} is joining a Group with ID(${groupId}).`)
        console.log()
        return new Promise(async (resolve, reject) => {
            socket.groupId = groupId
            try {
                let user = await redisHandler.hget(dataMap.onlineUserHm, socket.userId)
                user = JSON.parse(user)
                user.groupId = groupId
                redisHandler.hmset(dataMap.onlineUserHm, {
                    [socket.userId]: JSON.stringify(user)
                })
                dao.sqlHandler(sqls.sql_incrementCnt, groupId)
                    .then(_ => resolve(socket))
                    .catch(reject)
            } catch (err) {
                return reject(err)
            }
        })
    },

    disjoinGroup: socket => {
        return new Promise(async (resolve, reject) => {
            try {
                // remove it here so that the absence of the group can be detected later.
                redisHandler.srem(dataMap.groupIndicator + socket.groupId, socket.userId)

                let result = await dao.sqlHandler(sqls.sql_decrementCnt, [socket.groupId, socket.groupId])
                let user = await redisHandler.hget(dataMap.onlineUserHm, socket.userId)
                user = JSON.parse(user)
                user.groupId = null
                redisHandler.hmset(dataMap.onlineUserHm, {
                    [socket.userId]: JSON.stringify(user)
                })
                let list = await redisHandler.keys(dataMap.groupIndicator + '*')
                let groupSet = new Set(list)
                if (!groupSet.has(dataMap.groupIndicator + socket.groupId)) {
                    eventEmitter.emit('group.list.refresh', {
                        groupId: socket.groupId,
                        isOnline: false,
                    })
                }
                if (!result[1][0].cnt) {
                    await dao.sqlHandler(sqls.sql_removeGroup, socket.groupId)
                    console.log(`[userController]: ${socket.userId} has successfully disjoined a Group with ID(${socket.groupId}).`)
                    console.log()
                    delete socket.groupId
                    resolve()
                }
                else {
                    console.log(`[userController]: ${socket.userId} has successfully disjoined a Group with ID(${socket.groupId}).`)
                    console.log()
                    delete socket.groupId
                    resolve()
                }
            } catch (err) {
                return reject(err)
            }
        })
    },

    // socket.join and handle redis(group members, not the onlineUserHm)
    // at this point, socket has socket.groupId
    enterGroup: socket => {
        if (!socket.groupId) return Promise.resolve()
        return new Promise(async (resolve, reject) => {
            console.log('now adding group info')
            console.log(socket.groupId, socket.userId)
            console.log()

            try {
                let list = await redisHandler.keys(dataMap.groupIndicator + '*')
                let groupSet = new Set(list)
                if (!groupSet.has(dataMap.groupIndicator + socket.groupId)) {
                    eventEmitter.emit('group.list.refresh', {
                        groupId: socket.groupId,
                        isOnline: true,
                    })
                }
                redisHandler.sadd(dataMap.groupIndicator + socket.groupId, socket.userId)
                socket.join(socket.groupId)
                console.log(`[userController]: ${socket.userId} has successfully entered a Group with ID(${socket.groupId}).`)
                console.log()
                resolve()
            } catch (err) {
                return reject(err)
            }
        })
    },

    listInRoom: socket => {
        console.log(`[userController]: ${socket.userId} is asking for list in his Room with ID(${socket.pos}).`)
        console.log()
        return new Promise(async (resolve, reject) => {
            try {
                resolve(await redisHandler.smembers(socket.pos))
            } catch (err) {
                return reject(err)
            }
        })
    },

    listInLobby: _ => {
        console.log(`[userController]: getting user list in Lobby.`)
        console.log()
        return new Promise(async (resolve, reject) => {
            try {
                resolve(await redisHandler.smembers(dataMap.lobby))
            } catch (err) {
                return reject(err)
            }
        })
    },

}