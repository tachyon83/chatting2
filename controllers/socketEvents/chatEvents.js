// acts as a router

const chat = require('../../controllers/chatController')
const resCode = require('../../config/resCode')
const responseHandler = require('../../utils/responseHandler')
const errorHandler = require('../../utils/errorHandler')
const redisHandler = require('../../config/redisHandler')
const dataMap = require('../../config/dataMap')


module.exports = (socket, io) => {

    socket.on('chat.out', chatDto => {
        chat.save(socket, chatDto)
            .then(async _ => {
                console.log('socket.pos in chatEvents:', socket.pos)
                console.log('chatDto in chatEvents:', chatDto)
                if (chatDto.type === 'all') {
                    console.log(`[chatEvents]: socket(${socket.userId}) is sending a chatDto(${chatDto.text}) to everyone in his/her room.`)
                    console.log()
                    // socket.to(socket.pos).emit('chat.in', responseHandler(true, resCode.success, chatDto))
                    console.log('sockets in this room', io.sockets.adapter.rooms.get(socket.pos))
                    // console.log('function?', io.in(socket.pos).emit)
                    io.in(socket.pos).emit('chat.in', responseHandler(true, resCode.success, chatDto))
                }
                // "로그인시에 group가입여부 확인후 group등의 키워드로 시작하는 방에 소켓 join"
                else if (chatDto.type === 'group') {
                    console.log(`[chatEvents]: socket(${socket.userId}) is sending a chatDto(${chatDto.text}) to groupMembers in his/her group.`)
                    console.log()
                    // socket.to(socket.groupId).emit('chat.in', responseHandler(true, resCode.success, chatDto))
                    io.in(socket.groupId).emit('chat.in', responseHandler(true, resCode.success, chatDto))
                } else {
                    // redis에서 해당 유저 소켓아이디 읽어서
                    try {
                        let user = await redisHandler.hget(dataMap.onlineUserHm, chatDto.to)
                        user = JSON.parse(user)
                        console.log(`[chatEvents]: socket(${socket.userId}) is whispering a chatDto(${chatDto.text}) to ${user.id}.`)
                        console.log()
                        io.to(socket.id).emit('chat.in', responseHandler(true, resCode.success, chatDto))
                        io.to(user.socketId).emit('chat.in', responseHandler(true, resCode.success, chatDto))
                    } catch (err) {
                        return socket.emit('system.error', errorHandler(err))
                    }
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
    socket.on('chat.read', (chatDtoId, cb) => {
        chat.read(socket, chatDtoId)
            .then(resultArr => cb(responseHandler(true, resCode.success, resultArr)))
            // .catch(err => cb(errorHandler(err)))
            .catch(err => socket.emit('system.error', errorHandler(err)))
    })

}
