// const redisClient = require('../config/redisClient')
const dataMap = require('../config/dataMap');
const redisHandler = require('../config/redisHandler')
const errorHandler = require('../utils/errorHandler')

module.exports = io => {

    io.use(async (socket, next) => {
        let currTime = new Date();
        let timeStamp = currTime.getHours() + ':' + currTime.getMinutes();
        console.log('[IO Entry]: ', timeStamp)
        console.log('[IO Entry]: socket-session.id', socket.request.session.id)
        console.log()

        next()

        // try {
        //     // let value = await redisHandler.get('sess:' + socket.request.session.id)
        //     let value = await redisHandler.hget(dataMap.sessionUserMap, socket.request.session.id)
        //     if (!value) {
        //         err = new Error()
        //         err.reason = 'noInfo'
        //         socket.emit('system.error', errorHandler(err))
        //     } else next()
        // } catch (err) {
        //     err.reason = 'dbError'
        //     socket.emit('system.error', errorHandler(err))
        // }
    })
    require('./ioConnection')(io)
}