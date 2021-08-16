const redisHandler = require('../config/redisHandler');
const dataMap = require('../config/dataMap')

/* 
    reads user ID from sessionUserMap by plugging in session ID.
    then, attach the user ID to the connected socket.
    then, user info in onlineUserHm will get the current socket ID.
    user group id from onlineUserHm will be added to the socket.

    this socket will not join lobby and its group here.
*/

module.exports = socket => {
    return new Promise(async (resolve, reject) => {
        try {
            // let userId = await redisHandler.hget(dataMap.sessionUserMap, sessionId)
            // socket.userId = userId
            socket.userId = socket.request.session.passport.user
            let user = await redisHandler.hget(dataMap.onlineUserHm, socket.userId)
            user = JSON.parse(user)
            user.socketId = socket.id
            socket.groupId = user.groupId
            redisHandler.hmset(dataMap.onlineUserHm, {
                [userId]: JSON.stringify(user)
            })
            console.log('[SessionToSocket]: Complete.')
            console.log()
            resolve()
        } catch (err) {
            return reject(err)
        }
    })
}