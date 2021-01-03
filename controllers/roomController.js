// db access
// can handle socket emission sometimes

const redisClient = require('../config/redisClient');
const dataMap = require('../config/dataMap')
const chatDto = require('../models/chatDto')
const eventEmitter = require('../config/eventEmitter')

module.exports = {

    isJoinable: roomId => {
        // just check if joinable, nothing else
        if (roomId === dataMap.lobby) return Promise.resolve(true)

        return new Promise((resolve, reject) => {
            redisClient.hget(dataMap.roomInfoHm, roomId, (err, room) => {
                if (err) {
                    err.reason = 'noInfo'
                    return reject(err)
                }
                room = JSON.parse(room)
                if (room.roomCnt < room.capacity) resolve(true)
                else {
                    err = new Error()
                    err.reason = 'noSpace'
                    reject(err)
                }
            })
        })
    },

    join: (socket, roomId) => {
        // if (!isJoinableResult) return Promise.resolve(false)
        return new Promise((resolve, reject) => {
            socket.join(roomId, () => {
                redisClient.sadd(roomId, socket.userId)
                socket.pos = roomId

                redisClient.hget(dataMap.onlineUserHm, socket.userId, (err, user) => {
                    if (err) {
                        err.reason = 'noInfo'
                        return reject(err)
                    }
                    user = JSON.parse(user)
                    user.pos = roomId
                    redisClient.hmset(dataMap.onlineUserHm, {
                        [socket.userId]: JSON.stringify(user)
                    })

                    if (roomId !== dataMap.lobby) {
                        redisClient.hget(dataMap.roomInfoHm, roomId, (err, room) => {
                            if (err) {
                                err.reason = 'noInfo'
                                return reject(err)
                            }
                            room = JSON.parse(room)
                            room.roomCnt++
                            redisClient.hmset(dataMap.roomInfoHm, {
                                [roomId]: JSON.stringify(room)
                            })
                            eventEmitter.emit('room.list.refresh', room)

                            socket.to(socket.pos).emit('chat.in', chatDto(null, null, '[Welcome]: ' + socket.userId + ' joined', 'all'))
                            resolve(true)
                        })
                    } else resolve(true)
                })
            })
        })
    },

    leave: socket => {
        return new Promise((resolve, reject) => {
            socket.leave(socket.pos, () => {
                redisClient.srem(socket.pos, socket.userId)
                if (socket.pos === dataMap.lobby) return Promise.resolve(true)

                redisClient.scard(socket.pos, (err, cnt) => {
                    if (err) return reject(err)
                    socket.to(socket.pos).emit('chat.in', chatDto(null, null, '[Farewell]: ' + socket.userId + ' left', 'all'))
                    if (cnt === 0) {
                        // delete chatLogs in redis
                        redisClient.del(socket.pos + 'chat')
                        // delete chatLogs in MySQL
                        // dao.delete(socket.pos+'chat')

                        redisClient.hdel(dataMap.roomInfoHm, socket.pos)
                        eventEmitter.emit('room.list.refresh', {
                            roomId: socket.pos,
                            roomClosed: true,
                        })
                        return resolve(true)
                    }

                    redisClient.hget(dataMap.roomInfoHm, socket.pos, (err, room) => {
                        if (err) {
                            err.reason = 'noInfo'
                            return reject(err)
                        }

                        room = JSON.parse(room)
                        room.roomCnt--
                        if (room.roomOwner === socket.userId) {
                            redisClient.srandmember(socket.pos, (err, userId) => {
                                if (err) return reject(err)
                                room.roomOwner = userId

                                redisClient.hmset(dataMap.roomInfoHm, {
                                    [socket.pos]: JSON.stringify(room)
                                })
                                eventEmitter.emit('room.list.refresh', room)
                                return resolve(true)
                            })
                        }
                        redisClient.hmset(dataMap.roomInfoHm, {
                            [socket.pos]: JSON.stringify(room)
                        })
                        eventEmitter.emit('room.list.refresh', room)
                        resolve(true)
                    })
                })
            })
        })
    },

    create: (socket, roomDto) => {
        return new Promise((resolve, reject) => {
            redisClient.get(dataMap.nextRoomId, (err, nextRoomId) => {
                if (err) return reject(err)
                redisClient.set(dataMap.nextRoomId, toString(parseInt(nextRoomId) + 1))

                roomDto.roomId = nextRoomId
                roomDto.roomCnt = 0
                roomDto.roomOwner = socket.userId

                redisClient.hmset(dataMap.roomInfoHm, {
                    [nextRoomId]: JSON.stringify(roomDto)
                })
                resolve(nextRoomId)
            })
        })
    },

    update: (socket, roomDto) => {
        return new Promise((resolve, reject) => {
            redisClient.hget(dataMap.roomInfoHm, socket.pos, (err, room) => {
                if (err) {
                    err.reason = 'noInfo'
                    return reject(err)
                }

                /*
                    better not include real-time changing values like roomCnt
                    in some static data storage like roomInfoHm
                */
                room = JSON.parse(room)
                room.roomPw = roomDto.roomPw
                room.Title = roomDto.roomTitle
                room.roomCapacity = roomDto.roomCapacity
                redisClient.hmset(dataMap.roomInfoHm, {
                    [roomDto.roomId]: JSON.stringify(room)
                })
                eventEmitter.emit('room.list.refresh', room)

                socket.to(socket.pos).emit('chat.in', chatDto(null, null, '[UPDATE]: room info updated', 'all'))
                resolve(true)
            })
        })

    },

    list: () => {
        const roomInfoCollector = roomIds => {
            if (!roomIds.length) return Promise.resolve([])

            const eachRoomHandler = roomId => new Promise((resolve, reject) => {
                redisClient.hget(dataMap.roomInfoHm, roomId, (err, roomDto) => {
                    if (err) return reject(err)
                    roomDto = JSON.parse(roomDto)
                    resolve(roomDto)
                })
            })
            return Promise.all(roomIds.map(eachRoomHandler))
        }

        const getRoomIds = () => {
            return new Promise((resolve, reject) => {
                redisClient.hkeys(dataMap.roomInfoHm, (err, roomIds) => {
                    if (err) return reject(err)
                    resolve(roomIds)
                })
            })
        }

        getRoomIds()
            .then(roomInfoCollector)
            .then(result => { return Promise.resolve(result) })
            .catch(err => { return Promise.reject(err) })
    },


}