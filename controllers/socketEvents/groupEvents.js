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
            console.log('group list in groupEvents', list)
            cb(responseHandler(true, resCode.success, list.map(e => e.substr(6))))
        })
    })
}