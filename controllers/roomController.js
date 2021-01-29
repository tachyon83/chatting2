// db access
// can handle socket emission sometimes

// could write this code without defining a class
// but just to make it easy to read, class is introduced here
// so that in eventHandlers like roomEvents.js, cleaner promise chains can be written.

const redisClient = require('../config/redisClient');
const dataMap = require('../config/dataMap')
const chatDto = require('../models/chatDto')
const eventEmitter = require('../config/eventEmitter')

module.exports = class RoomController {
    constructor(socket) {
        this.socket = socket
    }

    isJoinable = roomId => {
        console.log('roomId in isJoinable', roomId)
        // just check if joinable, nothing else
        if (roomId === dataMap.lobby) return Promise.resolve(true)

        return new Promise((resolve, reject) => {
            redisClient.hget(dataMap.roomInfoHm, roomId, (err, roomInfo) => {
                if (err) {
                    err.reason = 'noInfo'
                    return reject(err)
                }
                roomInfo = JSON.parse(roomInfo)
                if (roomInfo.roomCnt < roomInfo.roomCapacity) {
                    console.log('joinable!')
                    resolve(true)
                } else {
                    console.log('room full')
                    err = new Error()
                    err.reason = 'noSpace'
                    reject(err)
                }
            })
        })
    }

    join = roomId => {
        // if (!isJoinableResult) return Promise.resolve(false)
        return new Promise((resolve, reject) => {
            console.log('socket.pos before joining', this.socket.pos)
            console.log(this.socket._events)

            this.socket.join(roomId)
            console.log('inside socket.join and roomId', roomId)
            console.log('sadd check:', roomId, this.socket.userId)
            redisClient.sadd(roomId, this.socket.userId)
            this.socket.pos = roomId
            console.log('socket.pos after joining', this.socket.pos)

            redisClient.hget(dataMap.onlineUserHm, this.socket.userId, (err, user) => {
                if (err) {
                    err.reason = 'noInfo'
                    return reject(err)
                }
                user = JSON.parse(user)
                user.pos = roomId
                redisClient.hmset(dataMap.onlineUserHm, {
                    [this.socket.userId]: JSON.stringify(user)
                })

                if (roomId !== dataMap.lobby) {
                    redisClient.hget(dataMap.roomInfoHm, roomId, (err, roomInfo) => {
                        if (err) {
                            err.reason = 'noInfo'
                            return reject(err)
                        }
                        roomInfo = JSON.parse(roomInfo)
                        roomInfo.roomCnt++
                        redisClient.hmset(dataMap.roomInfoHm, {
                            [roomId]: JSON.stringify(roomInfo)
                        })
                        eventEmitter.emit('room.list.refresh', roomInfo)

                        this.socket.to(this.socket.pos).emit('chat.in', chatDto(null, null, '[Welcome]: ' + this.socket.userId + ' joined', 'all'))
                        resolve(true)
                    })
                } else resolve(true)
            })
        })
    }

    leave = _ => {
        console.log('leave in room Controller')
        return new Promise((resolve, reject) => {
            console.log('socket.pos: goint to leave from this room', this.socket.pos)
            console.log('socket.userId', this.socket.userId)
            this.socket.leave(this.socket.pos)
            redisClient.srem(this.socket.pos, this.socket.userId)
            if (this.socket.pos === dataMap.lobby) return resolve(true)
            this.socket.to(this.socket.pos).emit('chat.in', chatDto(null, null, '[Farewell]: ' + this.socket.userId + ' left', 'all'))

            redisClient.hget(dataMap.roomInfoHm, this.socket.pos, (err, roomInfo) => {
                if (err) {
                    err.reason = 'noInfo'
                    return reject(err)
                }

                roomInfo = JSON.parse(roomInfo)
                roomInfo.roomCnt--

                // case when no one left in the room
                if (roomInfo.roomCnt === 0) {
                    // delete chatLogs in redis
                    redisClient.del(this.socket.pos + 'chat')
                    // delete chatLogs in MySQL
                    // dao.delete(socket.pos+'chat')

                    redisClient.hdel(dataMap.roomInfoHm, this.socket.pos)
                    eventEmitter.emit('room.list.refresh', roomInfo)
                    return resolve(true)
                }

                // case when a new room owner needs to be assigned
                if (roomInfo.roomOwner === this.socket.userId) {
                    redisClient.srandmember(this.socket.pos, (err, userId) => {
                        if (err) return reject(err)
                        roomInfo.roomOwner = userId

                        redisClient.hmset(dataMap.roomInfoHm, {
                            [this.socket.pos]: JSON.stringify(roomInfo)
                        })
                        eventEmitter.emit('room.list.refresh', roomInfo)
                        return resolve(true)
                    })
                }

                // case when he/she can just leave...
                redisClient.hmset(dataMap.roomInfoHm, {
                    [this.socket.pos]: JSON.stringify(roomInfo)
                })
                eventEmitter.emit('room.list.refresh', roomInfo)
                return resolve(true)
            })
        })
    }

    create = roomDto => {
        return new Promise((resolve, reject) => {
            redisClient.get(dataMap.nextRoomId, (err, nextRoomId) => {
                if (err) return reject(err)
                console.log('nextRoomId before', nextRoomId)
                console.log('nextRoomId after', (parseInt(nextRoomId) + 1).toString())
                redisClient.set(dataMap.nextRoomId, (parseInt(nextRoomId) + 1).toString())

                roomDto.roomId = nextRoomId
                roomDto.roomCnt = 0
                roomDto.roomOwner = this.socket.userId

                redisClient.hmset(dataMap.roomInfoHm, {
                    [nextRoomId]: JSON.stringify(roomDto)
                })
                resolve(nextRoomId)
            })
        })
    }

    update = roomDto => {
        return new Promise((resolve, reject) => {
            redisClient.hget(dataMap.roomInfoHm, this.socket.pos, (err, roomInfo) => {
                if (err) {
                    err.reason = 'noInfo'
                    return reject(err)
                }

                /*
                    better not include real-time changing values like roomCnt
                    in some static data storage like roomInfoHm
                */
                roomInfo = JSON.parse(roomInfo)
                roomInfo.roomPw = roomDto.roomPw
                roomInfo.Title = roomDto.roomTitle
                roomInfo.roomCapacity = roomDto.roomCapacity
                redisClient.hmset(dataMap.roomInfoHm, {
                    [roomDto.roomId]: JSON.stringify(roomInfo)
                })
                eventEmitter.emit('room.list.refresh', roomInfo)

                this.socket.to(this.socket.pos).emit('chat.in', chatDto(null, null, '[UPDATE]: room info updated', 'all'))
                resolve(true)
            })
        })
    }

    list = _ => {
        const roomInfoCollector = roomIds => {
            console.log('roomIds', roomIds)
            if (!roomIds.length) return Promise.resolve([])

            const eachRoomHandler = roomId => new Promise((resolve, reject) => {
                redisClient.hget(dataMap.roomInfoHm, roomId, (err, roomInfo) => {
                    if (err) return reject(err)
                    roomInfo = JSON.parse(roomInfo)
                    resolve(roomInfo)
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

        return getRoomIds()
            .then(roomInfoCollector)
            .catch(err => { return Promise.reject(err) })
    }
}
