const redisClient = require('../config/redisClient');
const sessionToSocket = require('../utils/sessionToSocket')
const roomLeaveProcess = require('../utils/roomLeaveProcess')


module.exports = io => {
    io.on('connection', socket => {
        // 아래 과정에서 에러 발생시, 중단 처리 관련하여 고민 필요
        sessionToSocket(socket.request.session.id, socket)
            .then(() => {
                console.log('finally a socket is connected and ready to be used!');
                socket.join('0', () => {
                    redisClient.sadd('0', socket.userId)
                    socket.pos = '0'
                    console.log('joined 0 and in standby after login')
                    redisClient.hget('onlineUsers', socket.userId, (err, user) => {
                        if (err) throw err
                        user = JSON.parse(user)
                        user.status = '0'
                        redisClient.hmset('onlineUsers', {
                            [socket.userId]: JSON.stringify(user)
                        })
                    })
                    console.log(Object.keys(io.sockets.adapter.rooms))
                    console.log(io.sockets.adapter.rooms['0'].sockets)
                    console.log(Object.keys(io.sockets.adapter.rooms['0'].sockets))
                })
            })
            .catch(err => console.log(err))

        socket.on('disconnecting', reason => {
            // 방을 나가고 (0번방에서도 나가기)
            // onlineUsers, sessionMap 정리
            // session.destroy

            console.log('disconnecting reason', reason);

            if (reason === 'server namespace disconnect' || reason === 'transport close') {
                roomLeaveProcess(socket).then(() => {
                    redisClient.hdel('onlineUsers', socket.userId)
                    redisClient.hdel('sessionMap', socket.request.session.id)

                    socket.request.logOut()
                    socket.request.session.destroy(err => {
                        if (err) return socket.emit('system.error', { packet: err })
                        socket.emit('system.signout')
                        console.log('looks like working fine?')
                    })
                })
            }
        })

        // require('./socketEvents/roomEvents')(socket)
    })
}