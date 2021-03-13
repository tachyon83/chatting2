// db access
// can handle socket emission sometimes

// could write this code without defining a class
// but just to make it easy to read, class is introduced here
// so that in eventHandlers like roomEvents.js, cleaner promise chains can be written.

const redisClient = require('../config/redisClient');
const dataMap = require('../config/dataMap')
const chatDto = require('../models/chatDto')
const eventEmitter = require('../config/eventEmitter')
const userController = require('./userController')

module.exports = class RoomController {
    constructor(socket) {
        this.socket = socket
    }

    isJoinable = roomDto => {
        // just check if joinable, nothing else
        if (roomDto.roomId === dataMap.lobby) return Promise.resolve(true)

        return new Promise((resolve, reject) => {
            redisClient.hget(dataMap.roomInfoHm, roomDto.roomId, (err, roomInfo) => {
                if (err) {
                    err.reason = 'noInfo'
                    return reject(err)
                }
                roomInfo = JSON.parse(roomInfo)
                if (roomInfo.roomCnt < roomInfo.roomCapacity) {
                    if (roomInfo.roomPw !== roomDto.roomPw) return resolve(false)
                    console.log(`[Room]: Room ID(${roomDto.roomId}) is Joinable`)
                    console.log()
                    resolve(true)
                } else {
                    console.log('[Room]: Room Full. Unable to Join')
                    console.log()
                    err = new Error()
                    err.reason = 'noSpace'
                    reject(err)
                }
            })
        })
    }

    joinGroup = _ => {
        return new Promise(async (resolve, reject) => {
            try {
                await userController.enterGroup(this.socket)
                return resolve()
            } catch (err) {
                return reject(err)
            }
        })
    }

    join = roomId => {
        // roomInfoHm does not contain '0' because the room list comes from roomInfoHm
        // the lobby is separated.

        // if (!isJoinableResult) return Promise.resolve(false)
        return new Promise(async (resolve, reject) => {
            // console.log(this.socket._events)

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

                try {
                    this.socket.join(roomId)
                    redisClient.sadd(roomId, this.socket.userId)
                    this.socket.pos = roomId
                } catch (err) {
                    return reject(err)
                }
                eventEmitter.emit('user.list.refresh', {
                    roomId,
                    userDto: {
                        userId: this.socket.userId,
                        isOnline: true,
                    }
                })

                if (roomId === dataMap.lobby) {
                    console.log(`[Lobby]: ${this.socket.userId} joined the lobby.`)
                    console.log()
                    return resolve(roomId)
                }
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

                    console.log(`[Room]: ${this.socket.userId} joined a Room with ID(${roomId}).`)
                    console.log()
                    eventEmitter.emit('room.list.refresh', roomInfo)

                    this.socket.to(this.socket.pos).emit('chat.in', chatDto(null, null, '[Welcome]: ' + this.socket.userId + ' joined', 'all'))
                    resolve(roomId)
                })
            })
        })
    }

    // leaveGroup=_=>{
    //     if(!this.socket.groupId)return Promise.resolve()
    //     return new Promise((resolve,reject)=>{
    //         this.socket.leave(this.socket.groupId)
    //         console.log(`[Group]: ${this.socket.userId} left a group room with ID(${this.socket.groupId}).`)
    //         console.log()
    //         delete this.socket.groupId
    //         // redis 수정...
    //     })
    // }

    leave = _ => {
        return new Promise((resolve, reject) => {
            this.socket.leave(this.socket.pos)
            redisClient.srem(this.socket.pos, this.socket.userId)
            console.log(`[Room]: ${this.socket.userId} left a Room with ID(${this.socket.pos}).`)
            console.log()
            this.socket.to(this.socket.pos).emit('chat.in', chatDto(null, null, '[Farewell]: ' + this.socket.userId + ' left', 'all'))

            eventEmitter.emit('user.list.refresh', {
                roomId: this.socket.pos,
                userDto: {
                    userId: this.socket.userId,
                    isOnline: false,
                }
            })

            if (this.socket.pos === dataMap.lobby) return resolve(true)

            redisClient.hget(dataMap.roomInfoHm, this.socket.pos, (err, roomInfo) => {
                if (err) {
                    err.reason = 'noInfo'
                    return reject(err)
                }

                roomInfo = JSON.parse(roomInfo)
                roomInfo.roomCnt--

                if (roomInfo.roomCnt === 0) {

                    // case when no one left in the room
                    // delete chatLogs in redis
                    redisClient.del(this.socket.pos + 'chat')
                    // delete chatLogs in MySQL
                    // dao.delete(socket.pos+'chat')

                    redisClient.hdel(dataMap.roomInfoHm, this.socket.pos)
                    eventEmitter.emit('room.list.refresh', roomInfo)
                    return resolve(true)

                } else if (roomInfo.roomOwner === this.socket.userId) {

                    // case when a new room owner needs to be assigned
                    redisClient.srandmember(this.socket.pos, (err, userId) => {
                        if (err) return reject(err)

                        roomInfo.roomOwner = userId
                        redisClient.hmset(dataMap.roomInfoHm, {
                            [this.socket.pos]: JSON.stringify(roomInfo)
                        })
                        eventEmitter.emit('room.list.refresh', roomInfo)
                        console.log(`[Room]: ${userId} now owns a Room (${this.socket.pos}).`)
                        console.log()
                        return resolve(true)
                    })
                } else {

                    // case when he/she can just leave...
                    redisClient.hmset(dataMap.roomInfoHm, {
                        [this.socket.pos]: JSON.stringify(roomInfo)
                    })
                    eventEmitter.emit('room.list.refresh', roomInfo)
                    return resolve(true)
                }
            })
        })
    }

    create = roomDto => {
        return new Promise((resolve, reject) => {
            redisClient.get(dataMap.nextRoomId, (err, nextRoomId) => {
                console.log(nextRoomId)
                if (err) return reject(err)
                redisClient.set(dataMap.nextRoomId, parseInt(nextRoomId) + 1)

                roomDto.roomId = nextRoomId
                roomDto.roomCnt = 0
                roomDto.roomOwner = this.socket.userId

                redisClient.hmset(dataMap.roomInfoHm, {
                    [nextRoomId]: JSON.stringify(roomDto)
                })
                console.log(`[Room]: ${this.socket.userId} has created a New Room with ID(${nextRoomId}).`)
                console.log()
                resolve(nextRoomId)
            })
        })
    }

    info = _ => {
        return new Promise((resolve, reject) => {
            redisClient.hget(dataMap.roomInfoHm, this.socket.pos, (err, roomInfo) => {
                if (err) {
                    err.reason = 'noInfo'
                    return reject(err)
                }

                roomInfo = JSON.parse(roomInfo)
                resolve(roomInfo)
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
                roomInfo.roomTitle = roomDto.roomTitle
                roomInfo.roomCapacity = roomDto.roomCapacity

                redisClient.hmset(dataMap.roomInfoHm, {
                    [roomDto.roomId]: JSON.stringify(roomInfo)
                })
                eventEmitter.emit('room.list.refresh', roomInfo)

                console.log(`[Room]: A Room with ID(${this.socket.pos}) has been updated.`)
                console.log()

                this.socket.to(this.socket.pos).emit('chat.in', chatDto(null, null, '[UPDATE]: room info updated', 'all'))
                resolve(true)
            })
        })
    }

    list = _ => {
        const roomInfoCollector = roomIds => {
            console.log(`[Room]: Room List has been sent to ${this.socket.userId}.`)
            console.log()
            console.log('roomIds', roomIds)
            console.log()
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
