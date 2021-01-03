// acts as a router

const chat = require('../../controllers/chatController')
const resCode = require('../../config/resCode')
const responseHandler = require('../../utils/responseHandler')
const errorHandler = require('../../utils/errorHandler')


module.exports = socket => {

    socket.on('chat.out', chatDto => {
        socket.to(socket.pos).emit('chat.in', responseHandler(true, resCode.success, chatDto))
        // io.in(socket.pos).emit('chat.in', chatDto)
    })

    socket.on('chat.save', (chatDto, cb) => {
        chat.save(socket, chatDto)
            .then(result => cb(responseHandler(result, resCode.success, null)))
            .catch(err => cb(errorHandler(err)))
    })

    socket.on('chat.read', cb => {
        chat.read(socket)
            .then(resultArr => cb(responseHandler(true, resCode.success, resultArr)))
            .catch(err => cb(errorHandler(err)))
    })

}