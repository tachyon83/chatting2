const resCode = require('../../config/resCode')
const responseHandler = require('../../utils/responseHandler')
const errorHandler = require('../../utils/errorHandler')
// const redisClient = require('../../config/redisClient')
const redisHandler = require('../../config/redisHandler')
const dataMap = require('../../config/dataMap')


module.exports = socket => {

    // group.list.refresh to lobby

    socket.on('group.list', async cb => {
        try {
            let list = await redisHandler.keys(dataMap.groupIndicator + '*')
            console.log('group list in groupEvents', list)
            cb(responseHandler(true, resCode.success, list.map(e => e.substr(6))))
        } catch (err) {
            return cb(errorHandler(err))
        }
    })
}