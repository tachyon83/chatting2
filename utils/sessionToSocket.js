const redisClient = require('../config/redisClient');

module.exports = (sessionId, socket) => {
    return new Promise((resolve, reject) => {
        redisClient.hget('sessionMap', sessionId, (err, userId) => {
            if (err) reject(err)
            socket.userId = userId
            redisClient.hget('onlineUsers', userId, (err, user) => {
                if (err) reject(err)
                user = JSON.parse(user)
                user.socketId = socket.id
                redisClient.hmset('onlineUsers', {
                    [userId]: JSON.stringify(user)
                })
                resolve()
            })
        })
    })
}