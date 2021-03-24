const resCode = require('../../config/resCode')
const responseHandler = require('../../utils/responseHandler')
const errorHandler = require('../../utils/errorHandler')
const redisClient = require('../../config/redisClient')
const dataMap = require('../../config/dataMap')


module.exports = socket => {

    // group.list.refresh to lobby

    socket.on('group.list', cb => {
        redisClient.keys(dataMap.groupIndicator + '*', (err, list) => {
            if (err) return cb(errorHandler(err))
            list = list.map(e => e.substr(6))
            cb(responseHandler(true, resCode.success, result))
        })
    })
}