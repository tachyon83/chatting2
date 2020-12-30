const redisClient = require('../../config/redisClient');
const sessionToSocket = require('../../utils/sessionToSocket')

module.exports = io => {
    io.on('connection', socket => {
        // 아래 과정에서 에러 발생시, 중단 처리 관련하여 고민 필요
        sessionToSocket(socket.request.session.id, socket)
            .then(() => {
                console.log('finally a socket is connected and ready to be used!');
                socket.join(0, () => {
                    redisClient.sadd('0', socket.userId)
                    socket.pos = 0
                    console.log('joined 0 and in standby after login')
                    redisClient.hget('onlineUsers', socket.userId, (err, user) => {
                        if (err) throw err
                        user = JSON.parse(user)
                        user.status = 0
                        redisClient.hmset('onlineUsers', {
                            [socket.userId]: JSON.stringify(user)
                        })
                    })
                })
            })
            .catch(err => console.log(err))

        require('../socketEvents/roomEvents')(socket)
    })
}