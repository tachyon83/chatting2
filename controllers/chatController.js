// db access
// can handle socket emission sometimes

const redisClient = require('../config/redisClient');
const dataMap = require('../config/dataMap')
// const chatDto = require('../models/chatDto')

module.exports = {
    save: (socket, chatDto) => {
        return new Promise((resolve, reject) => {
            redisClient.lrange(socket.pos + 'chat', 0, 0, (err, msg) => {
                if (err) {
                    err.reason = 'error'
                    return reject(err)
                }
                if (!msg) {
                    chatDto.id = 0
                } else {
                    msg = JSON.parse(msg)
                    chatDto.id = parseInt(msg.id) + 1
                }
                redisClient.lpush(socket.pos + 'chat', JSON.stringify(chatDto))
                resolve(true)
            })
        })
    },

    read: (socket, id) => {
        // 1st check redis, then 2nd check MySQL
        // changed...=>not going to save chat in MySQL

        return new Promise((resolve, reject) => {
            redisClient.llen(socket.pos + 'chat', (err, len) => {
                if (err) {
                    err.reason = 'error'
                    return reject(err)
                }
                if (!len) return resolve([])
                redisClient.lrange(socket.pos + 'chat', id, id + dataMap.linesToRead - 1, (err, list) => {
                    if (err) {
                        err.reason = 'error'
                        return reject(err)
                    }
                    // redisClient.ltrim(socket.pos + 'chat', dataMap.linesToRead, -1)
                    resolve(list)
                })
            })
        })
    },

}