// acts as a router

const chat = require('../../controllers/chatController')
const resCode = require('../../config/resCode')
const responseHandler = require('../../utils/responseHandler')
const errorHandler = require('../../utils/errorHandler')
const redisClient = require('../../config/redisClient')
const dataMap = require('../../config/dataMap')


module.exports = (socket, io) => {

    socket.on('chat.out', chatDto => {
        chat.save(socket, chatDto)
            .then(_ => {
                if (chatDto.type === 'all') socket.to(socket.pos).emit('chat.in', responseHandler(true, resCode.success, chatDto))
                // "로그인시에 group가입여부 확인후 group등의 키워드로 시작하는 방에 소켓 join"
                else if (chatDto.type === 'group') socket.to(socket.group).emit('chat.in', responseHandler(true, resCode.success, chatDto))
                else {
                    // redis에서 해당 유저 소켓아이디 읽어서
                    redisClient.hget(dataMap.onlineUserHm, chatDto.to, (err, user) => {
                        if (err) return socket.emit('system.error', errorHandler(err))
                        user = JSON.parse(user)
                        io.sockets.socket(user.socketId).emit('chat.in', responseHandler(true, resCode.success, chatDto))
                    })
                }
            })
            .catch(err => socket.emit('system.error', errorHandler(err)))
    })

    // socket.on('chat.save', (chatDto, cb) => {
    //     chat.save(socket, chatDto)
    //         .then(result => cb(responseHandler(result, resCode.success, null)))
    //         .catch(err => cb(errorHandler(err)))
    // })

    // chat id가 프론트에서 보일 경우, 몇번의 그룹채팅과 귓속말이 있었는지 노출됨...
    socket.on('chat.read', cb => {
        chat.read(socket)
            .then(resultArr => cb(responseHandler(true, resCode.success, resultArr)))
            // .catch(err => cb(errorHandler(err)))
            .catch(err => socket.emit('system.error', errorHandler(err)))
    })

}
