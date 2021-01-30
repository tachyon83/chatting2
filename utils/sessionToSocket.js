const redisClient = require('../config/redisClient');
const dataMap = require('../config/dataMap')

module.exports = (sessionId, socket) => {
    return new Promise((resolve, reject) => {

        redisClient.hget(dataMap.sessionUserMap, sessionId, (err, userId) => {
            if (err) return reject(err)
            socket.userId = userId
            redisClient.hget(dataMap.onlineUserHm, userId, (err, user) => {
                if (err) return reject(err)
                user = JSON.parse(user)
                user.socketId = socket.id
                redisClient.hmset(dataMap.onlineUserHm, {
                    [userId]: JSON.stringify(user)
                })
                console.log('[SessionToSocket]: Work Complete.')
                console.log()
                resolve()
            })
        })
    })
}