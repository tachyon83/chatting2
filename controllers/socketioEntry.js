const redisClient = require('../config/redisClient')
const errorHandler = require('../utils/errorHandler')

module.exports = io => {

    io.use((socket, next) => {
        let currTime = new Date();
        let timeStamp = currTime.getHours() + ':' + currTime.getMinutes();
        console.log('[IO EVENT]: ', timeStamp)

        redisClient.get('sess:' + socket.request.session.id, (err, value) => {
            if (err) {
                err.reason = 'dbError'
                socket.emit('system.error', errorHandler(err))
            }
            if (!value) {
                err = new Error()
                err.reason = 'noInfo'
                socket.emit('system.error', errorHandler(err))
            }
            else next()
        })
    })

    require('./ioConnection')(io)
}