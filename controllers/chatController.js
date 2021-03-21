// db access
// can handle socket emission sometimes

const redisClient = require('../config/redisClient');
const dataMap = require('../config/dataMap')
// const chatDto = require('../models/chatDto')

const chatLogsMaker = (socket, chatDtoId, chatLogs) => {
    return new Promise((resolve, reject) => {
        redisClient.lindex(socket.pos + 'chat', chatDtoId + 1, (err, chatDto) => {
            if (err) return reject(err)
            let result = {}

            chatDto = JSON.parse(chatDto)
            if (chatDto.from === socket.userId || chatDto.to === socket.userId || (socket.groupId && socket.groupId === chatDto.to)) result = JSON.parse(chatDto)
            // id--
            // result.id = id
            resolve(result)
        })
    })
}

module.exports = {
    save: (socket, chatDto) => {
        console.log(`[chatController]: socket(${socket.userId}) has sent a message(${chatDto}).`)
        console.log()
        return new Promise((resolve, reject) => {
            redisClient.llen(socket.pos + 'chat', (err, len) => {
                if (err) return reject(err)
                if (!len) chatDto.id = 0
                else chatDto.id = len
                redisClient.rpush(socket.pos + 'chat', JSON.stringify(chatDto))
                console.log(`[chatController]: A Message(${chatDto}) with its ID(${chatDto.id}) has successfully been saved to chatLogs in Redis.`)
                console.log()
                resolve(true)
            })
        })
    },

    read: (socket, chatDtoId) => {
        // 1st check redis, then 2nd check MySQL
        // changed...=>not going to save chat in MySQL

        // first check length, if(!length)just return the empty arr
        // if(length) lindex

        console.log(`[chatController]: socket(${socket.userId}) is getting old chatLogs earlier than chatDtoId(${chatDtoId}).`)
        console.log()
        return new Promise((resolve, reject) => {
            redisClient.llen(socket.pos + 'chat', async (err, len) => {
                len = parseInt(len)
                let chatLogs = []

                if (err) {
                    err.reason = 'error'
                    return reject(err)
                }
                if (!len || !chatDtoId) return resolve(chatLogs)

                while (chatDtoId >= 0 && chatLogs.length < dataMap.linesToRead) {
                    try {
                        let result = await chatLogsMaker(socket, chatDtoId, chatLogs)
                        chatDtoId = result.id
                        chatLogs.push(result)
                    } catch (err) {
                        return reject(err)
                    }
                }
                console.log(`[chatController]: Now Sending old chatLogs earlier than chatDtoId(${chatDtoId}) to Socket(${socket.userId}).`)
                console.log()
                resolove(chatLogs)
            })
        })
    },
}