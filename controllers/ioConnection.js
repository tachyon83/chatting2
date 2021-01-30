const redisClient = require('../config/redisClient');
const dataMap = require('../config/dataMap')
const resCode = require('../config/resCode')
const sessionToSocket = require('../utils/sessionToSocket')
const roomController = require('../controllers/roomController')
const responseHandler = require('../utils/responseHandler')
const errorHandler = require('../utils/errorHandler')
const eventEmitter = require('../config/eventEmitter')


module.exports = io => {

    // console.log(Object.keys(io.sockets.adapter.rooms))
    // console.log(io.sockets.adapter.rooms['0'].sockets)
    // console.log(Object.keys(io.sockets.adapter.rooms['0'].sockets))

    eventEmitter.on('room.list.refresh', roomDto => {
        io.in(dataMap.lobby).emit('room.list.refresh', responseHandler(true, resCode.success, roomDto))
    })

    io.on('connection', socket => {
        console.log('[IO]: A New Socket Connected!')
        console.log('[IO]: Session ID in this Socket:', socket.request.session.id)
        console.log('[IO]: Socket ID:', socket.id)
        console.log()

        const room = new roomController(socket)

        // 아래 과정에서 에러 발생시, 중단 처리 관련하여 고민 필요
        sessionToSocket(socket.request.session.id, socket)
            .then(() => {
                console.log('[IO]: Now Joining Lobby...')
                console.log()
                room.join(dataMap.lobby)
            })
            .catch(err => {
                console.log(err)
                console.log()
                socket.emit('system.error', errorHandler(err))
                // need to disconnect this socket?
            })

        socket.on('abc', () => {
            console.log('abc test !')
        })

        socket.on('disconnecting', reason => {
            // 방을 나가고 (0번방에서도 나가기)
            // onlineUsers, sessionMap등등 정리
            // session.destroy

            console.log('[IO]: Disconnecting Reason', reason);
            console.log()

            if (reason === 'server namespace disconnect' || reason === 'transport close') {
                room.leave()
                    .then(() => {
                        console.log('[IO]: This Socket Left a Room or Lobby')
                        console.log()
                        redisClient.hdel(dataMap.onlineUserHm, socket.userId)
                        redisClient.hdel(dataMap.sessionUserMap, socket.request.session.id)

                        socket.request.logOut()
                        socket.request.session.destroy(err => {
                            if (err) return socket.emit('system.error', errorHandler(err))
                            console.log('[IO]:', socket.userId + ' has successfully signed out/disconnected.')
                            console.log()
                        })
                    })
                    .catch(err => console.log(err))
            }
        })

        require('./socketEvents/roomEvents')(room)
        require('./socketEvents/chatEvents')(socket)
        require('./socketEvents/userEvents')(socket)

    })
}