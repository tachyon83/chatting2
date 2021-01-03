const redisClient = require('../config/redisClient');
const dataMap = require('../config/dataMap')
const resCode = require('../config/resCode')
const sessionToSocket = require('../utils/sessionToSocket')
const room = require('../controllers/roomController')
const responseHandler = require('../utils/responseHandler')
const errorHandler = require('../utils/errorHandler')
const eventEmitter = require('../../config/eventEmitter')



module.exports = io => {

    // console.log(Object.keys(io.sockets.adapter.rooms))
    // console.log(io.sockets.adapter.rooms['0'].sockets)
    // console.log(Object.keys(io.sockets.adapter.rooms['0'].sockets))

    eventEmitter.on('room.list.refresh', roomDto => {
        io.in(dataMap.lobby).emit('room.list.refresh', responseHandler(true, resCode.success, roomDto))
    })

    io.on('connection', socket => {
        // 아래 과정에서 에러 발생시, 중단 처리 관련하여 고민 필요
        sessionToSocket(socket.request.session.id, socket)
            .then(() => room.join(socket, dataMap.lobby))
            .catch(err => socket.emit('system.error', errorHandler(err)))


        socket.on('disconnecting', reason => {
            // 방을 나가고 (0번방에서도 나가기)
            // onlineUsers, sessionMap등등 정리
            // session.destroy

            console.log('disconnecting reason', reason);

            if (reason === 'server namespace disconnect' || reason === 'transport close') {
                room.leave(socket).then(() => {
                    redisClient.hdel(dataMap.onlineUserHm, socket.userId)
                    redisClient.hdel(dataMap.sessionUserMap, socket.request.session.id)

                    socket.request.logOut()
                    socket.request.session.destroy(err => {
                        if (err) return socket.emit('system.error', errorHandler(err))
                        console.log(socket.userId + ' has successfully signed out/disconnected.')
                    })
                })
            }
        })

        require('./socketEvents/roomEvents')(socket)
        require('./socketEvents/chatEvents')(socket)
        require('./socketEvents/userEvents')(socket)

    })
}