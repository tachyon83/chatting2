const redisClient = require('../config/redisClient');

module.exports = socket => {
    return new Promise((resolve, reject) => {
        socket.leave(socket.pos, () => {
            redisClient.srem(socket.pos, socket.userId)

            // 'someone left' message event

            // determine next room owner
            // see if no one remains => if no one remains, then delete all chatlogs

            resolve()
        })
    })
}