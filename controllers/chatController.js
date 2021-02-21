// db access
// can handle socket emission sometimes

const redisClient = require('../config/redisClient');
const dataMap = require('../config/dataMap')
// const chatDto = require('../models/chatDto')

const chatLogsMaker = (socket, id, chatLogs) => {
    return new Promise((resolve, reject) => {
        redisClient.lindex(socket.pos + 'chat', id + 1, (err, chatDto) => {
            if (err) return reject(err)
            let result = {}

            chatDto = JSON.parse(chatDto)
            if (chatDto.from === socket.userId || chatDto.to === socket.userId || (socket.groupId && socket.groupId === chatDto.to)) result.chatLog = JSON.parse(chatDto)
            id--
            result.id = id
            resolve(result)
        })
    })
}

module.exports = {
    save: (socket, chatDto) => {
        return new Promise((resolve, reject) => {
            redisClient.llen(socket.pos + 'chat', (err, len) => {
                if (err) return reject(err)
                if (!len) chatDto.id = 0
                else chatDto.id = len
                redisClient.rpush(socket.pos + 'chat', JSON.stringify(chatDto))
                resolve(true)
            })
        })
    },

    read: (socket, id) => {
        // 1st check redis, then 2nd check MySQL
        // changed...=>not going to save chat in MySQL

        // first check length, if(!length)just return the empty arr
        // if(length) lindex

        return new Promise((resolve, reject) => {
            redisClient.llen(socket.pos + 'chat', async (err, len) => {
                let chatLogs = []

                if (err) {
                    err.reason = 'error'
                    return reject(err)
                }
                if (!len || !id) return resolve(chatLogs)

                while (id >= 0 && chatLogs.length < dataMap.linesToRead) {
                    try {
                        let result = await chatLogsMaker(socket, id, chatLogs)
                        id = result.id
                        chatLogs = chatLogs.push(result.chatLog)
                    } catch (err) {
                        return reject(err)
                    }
                }
                resolove(chatLogs)
            })
        })
    },
}