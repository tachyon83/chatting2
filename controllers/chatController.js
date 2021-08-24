// db access
// can handle socket emission sometimes

// const redisClient = require('../config/redisClient');
const redisHandler = require('../config/redisHandler');
const dataMap = require('../config/dataMap')
// const chatDto = require('../models/chatDto')

// chatDtoId must be one less
const chatLogsMaker = (socket, chatDtoId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let chatDto = await redisHandler.lindex(socket.pos + 'chat', chatDtoId)
            chatDto = JSON.parse(chatDto)
            if (!chatDto.to || chatDto.from === socket.userId || chatDto.to === socket.userId || (socket.groupId && socket.groupId === chatDto.to)) resolve(chatDto)
            else resolve(null)

        } catch (err) {
            return reject(err)
        }
    })
}

module.exports = {
    save: (socket, chatDto) => {
        console.log(`[chatController]: socket(${socket.userId}) has sent a message(${chatDto}).`)
        console.log()
        return new Promise(async (resolve, reject) => {
            try {
                let len = await redisHandler.llen(socket.pos + 'chat')
                if (!len) chatDto.id = 0
                else chatDto.id = len
                redisHandler.rpush(socket.pos + 'chat', JSON.stringify(chatDto))
                console.log(`[chatController]: A Message(${chatDto}) with its ID(${chatDto.id}) has successfully been saved to chatLogs in Redis.`)
                console.log()
                resolve(true)
            } catch (err) {
                return reject(err)
            }
        })
    },

    read: (socket, chatDtoId) => {
        // 1st check redis, then 2nd check MySQL
        // changed...=>not going to save chat in MySQL

        // first check length, if(!length)just return the empty arr
        // if(length) lindex

        console.log(`[chatController]: socket(${socket.userId}) is getting old chatLogs earlier than chatDtoId(${chatDtoId}).`)
        console.log()
        return new Promise(async (resolve, reject) => {
            try {
                let len = parseInt(await redisHandler.llen(socket.pos + 'chat'))
                let chatLogs = []
                if (!len) return resolve(chatLogs)
                if (!chatDtoId) chatDtoId = len - 1
                else chatDtoId--
                while (chatDtoId >= 0 && chatLogs.length < dataMap.linesToRead) {
                    try {
                        let result = await chatLogsMaker(socket, chatDtoId, chatLogs)
                        if (result) {
                            chatDtoId = result.id
                            chatLogs.push(result)
                        }
                        chatDtoId--
                    } catch (err) {
                        return reject(err)
                    }
                }
                console.log(`[chatController]: Now Sending old chatLogs earlier than chatDtoId(${chatDtoId}) to Socket(${socket.userId}).`)
                console.log()
                console.log(chatLogs)
                resolve(chatLogs)
            } catch (err) {
                err.reason = 'error'
                return reject(err)
            }
        })
    },

}