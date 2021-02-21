const redisClient = require('../config/redisClient');
const dataMap = require('../config/dataMap')

/* 
    reads user ID from sessionUserMap by plugging in session ID.
    then, attach the user ID to the connected socket.
    then, user info in onlineUserHm will get the current socket ID.
    user group id from onlineUserHm will be added to the socket.

    this socket will not join lobby and its group here.
*/


module.exports = (sessionId, socket) => {
    return new Promise((resolve, reject) => {

        redisClient.hget(dataMap.sessionUserMap, sessionId, (err, userId) => {
            if (err) return reject(err)
            socket.userId = userId
            redisClient.hget(dataMap.onlineUserHm, userId, (err, user) => {
                if (err) return reject(err)
                user = JSON.parse(user)
                user.socketId = socket.id
                socket.groupId = user.groupId
                redisClient.hmset(dataMap.onlineUserHm, {
                    [userId]: JSON.stringify(user)
                })
                console.log('[SessionToSocket]: Complete.')
                console.log()
                resolve()
            })
        })
    })
}