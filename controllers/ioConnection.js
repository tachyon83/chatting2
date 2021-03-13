const redisClient = require('../config/redisClient');
const dataMap = require('../config/dataMap')
const resCode = require('../config/resCode')
const sessionToSocket = require('../utils/sessionToSocket')
const dao = require('../models/userDao')
const sqls = require('../models/settings/sqlDispenser')
const roomController = require('./roomController')
// const userController = require('./userController')
const responseHandler = require('../utils/responseHandler')
const errorHandler = require('../utils/errorHandler')
const eventEmitter = require('../config/eventEmitter')


module.exports = io => {

    // console.log(Object.keys(io.sockets.adapter.rooms))
    // console.log(io.sockets.adapter.rooms['0'].sockets)
    // console.log(Object.keys(io.sockets.adapter.rooms['0'].sockets))

    // 해당 유저의 온라인 여부 + 정보를 어디까지 포함해서 보낼지?
    // eventEmitter.on('lobby.user.list.refresh', userDto => {
    //     io.in(dataMap.lobby).emit('lobby.user.list.refresh', responseHandler(true, resCode.success, userDto))
    // })
    eventEmitter.on('user.list.refresh', roomAndUserDtoInfo => {
        io.in(roomAndUserDtoInfo.roomId).emit('user.list.refresh', responseHandler(true, resCode.success, roomAndUserDtoInfo.userDto))
    })

    eventEmitter.on('room.list.refresh', roomDto => {
        // console.log('io.sockets', Object.keys(io.sockets))
        // console.log('io.sockets._events', Object.keys(io.sockets._events))
        // console.log('io.sockets.adapter', Object.keys(io.sockets.adapter))
        // console.log('io.sockets.connected', Object.keys(io.sockets.connected))
        console.log('io.sockets.adapter.rooms', io.sockets.adapter.rooms)
        // console.log(io.sockets.adapter.rooms['0'].sockets)
        io.in(dataMap.lobby).emit('room.list.refresh', responseHandler(true, resCode.success, roomDto))
        // io.sockets.in(dataMap.lobby).emit('room.list.refresh', responseHandler(true, resCode.success, roomDto))
    })

    io.on('connection', async socket => {

        // const room = new roomController(socket)
        let room

        console.log('[IO]: A New Socket Connected!')
        console.log('[IO]: Session ID in this Socket:', socket.request.session.id)
        console.log('[IO]: Socket ID:', socket.id)
        console.log()

        // 아래 과정에서 에러 발생시, 중단 처리 관련하여 고민 필요
        try {
            await sessionToSocket(socket.request.session.id, socket)
            room = new roomController(socket)
            console.log('[IO]: Now Joining Lobby...')
            console.log()
            require('./socketEvents/roomEvents')(room)
            require('./socketEvents/chatEvents')(socket, io)
            require('./socketEvents/userEvents')(socket)
            require('./socketEvents/groupEvents')(socket)
            console.log('socket events', socket.eventNames())

            await room.join(dataMap.lobby)
            await room.joinGroup()
            // room.joinGroup()

            socket.emit('socket.ready', true, fromFront => {
                console.log('fromFront', fromFront)
            })
        } catch (err) {
            console.log(err)
            console.log()
            socket.emit('system.error', errorHandler(err))
            // need to disconnect this socket?
            throw err
        }

        // sessionToSocket(socket.request.session.id, socket)
        //     .then(async () => {
        //         console.log('[IO]: Now Joining Lobby...')
        //         console.log()
        //         try {
        //             await room.join(dataMap.lobby)
        //             await room.joinGroup()
        //         } catch (err) {
        //             // disconnect the socket and clear the info in redis
        //             // but for this time being, throwing err...
        //             throw err
        //         }
        //     })
        //     .catch(err => {
        //         console.log(err)
        //         console.log()
        //         socket.emit('system.error', errorHandler(err))
        //         // need to disconnect this socket?
        //         throw err
        //     })

        socket.on('abc', () => {
            console.log('abc test !')
        })

        socket.on('disconnecting', async reason => {
            // 방을 나가고 (0번방에서도 나가기)
            // onlineUsers, sessionMap등등 정리
            // session.destroy

            console.log('[IO]: Disconnecting Reason', reason);
            console.log()

            if (reason === 'server namespace disconnect' || reason === 'transport close') {
                room.leave()
                    .then(_ => {
                        console.log('[IO]: This Socket Left a Room or Lobby')
                        console.log()

                        redisClient.hdel(dataMap.sessionUserMap, socket.request.session.id)
                        redisClient.hdel(dataMap.onlineUserHm, socket.userId)

                        // socket automatically leaves all the rooms it was in when disconnected?
                        // so, the socket does not have to manually leaves its group room?
                        socket.request.logOut()
                        socket.request.session.destroy(async err => {
                            if (err) return socket.emit('system.error', errorHandler(err))
                            console.log('[IO]:', socket.userId + ' has successfully signed out/disconnected.')
                            console.log()
                            if (socket.groupId) {
                                redisClient.srem(dataMap.groupIndicator + socket.groupId, socket.userId)
                                try {
                                    await dao.sqlHandler(sqls.sql_updateUserUponLogout, [socket.groupId, socket.userId])
                                    console.log(`[MySQL]: ${socket.userId}'s groupId(${socket.groupId}) has been added to MySQL.`)
                                    console.log()
                                } catch (err) {
                                    throw err
                                }
                            }
                        })
                    })
                    .catch(err => console.log(err))
            }
        })

        // require('./socketEvents/roomEvents')(room)
        // require('./socketEvents/chatEvents')(socket, io)
        // require('./socketEvents/userEvents')(socket)
        // require('./socketEvents/groupEvents')(socket)
        // console.log('sockt events', socket.eventNames())

    })
}