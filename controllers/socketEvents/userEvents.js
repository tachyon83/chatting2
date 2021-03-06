// acts as a router

const user = require('../../controllers/userController')
const resCode = require('../../config/resCode')
const responseHandler = require('../../utils/responseHandler')
const errorHandler = require('../../utils/errorHandler')


module.exports = socket => {
    socket.on('user.update', (nick, cb) => {
        user.update(socket, nick)
            .then(_ => cb(responseHandler(true, resCode.success, null)))
            .catch(err => cb(errorHandler(err)))
    })
    socket.on('user.read', cb => {
        user.read(socket)
            .then(result => cb(responseHandler(true, resCode.success, result)))
            .catch(err => cb(errorHandler(err)))
    })
    socket.on('user.info', (id, cb) => {
        user.info(id)
            .then(result => cb(responseHandler(true, resCode.success, result)))
            .catch(err => cb(errorHandler(err)))
    })
    socket.on('user.createGroup', (groupId, cb) => {
        user.createGroup(socket, groupId)
            // it seems like socket object is not updated in this scope,
            // even after executing the above createGroup.
            // that is how user.enterGroup(socket) is dealing with previous groupId
            // .then(_user.enterGroup(socket))
            .then(user.enterGroup)
            .then(_ => cb(responseHandler(true, resCode.success, null)))
            .catch(err => cb(errorHandler(err)))
    })
    socket.on('user.joinGroup', (groupId, cb) => {
        user.joinGroup(socket, groupId)
            .then(user.enterGroup)
            .then(_ => cb(responseHandler(true, resCode.success, null)))
            .catch(err => cb(errorHandler(err)))
    })
    socket.on('user.disjoinGroup', cb => {
        user.disjoinGroup(socket)
            .then(_ => cb(responseHandler(true, resCode.success, null)))
            .catch(err => cb(errorHandler(err)))
    })
    socket.on('user.listInRoom', cb => {
        user.listInRoom(socket)
            .then(list => cb(responseHandler(true, resCode.success, list)))
            .catch(err => cb(errorHandler(err)))
    })
    socket.on('user.listInLobby', cb => {
        user.listInLobby()
            .then(list => cb(responseHandler(true, resCode.success, list)))
            .catch(err => cb(errorHandler(err)))
    })

}