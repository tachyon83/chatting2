// db access
// can handle socket emission sometimes

const redisClient = require('../config/redisClient');
const dataMap = require('../config/dataMap')
const chatDto = require('../models/chatDto')

module.exports = {
    save: (socket, chatDto) => {
        return new Promise((resolve, reject) => {
            redisClient.lpush(socket.pos + 'chat', JSON.stringify(chatDto))
            resolve(true)
        })
    },

    read: socket => {
        // 1st check redis, then 2nd check MySQL

        return new Promise((resolve, reject) => {
            redisClient.llen(socket.pos + 'chat', (err, len) => {
                if (err) return reject(err)
                if (!len) return resolve([])
                redisClient.lrange(socket.pos + 'chat', 0, dataMap.linesToRead - 1, (err, list) => {
                    if (err) return reject(err)
                    redisClient.ltrim(socket.pos + 'chat', dataMap.linesToRead, -1)
                    resolve(list)
                })
            })
        })
    },

}