// acts as a router

const room = require('../roomController2')
const resCode = require('../../config/resCode')
const responseHandler = require('../../utils/responseHandler')
const errorHandler = require('../../utils/errorHandler')
const dataMap = require('../../config/dataMap')


module.exports = socket => {
    // const room = new roomController(socket)

    socket.on('room.join', (roomId, cb) => {
        room.leave(socket)
            .then(_ => room.isJoinable(roomId))
            .then(_ => room.join(socket, roomId))
            .then(_ => cb(responseHandler(true, resCode.success, null)))
            .catch(err => cb(errorHandler(err)))
    })

    socket.on('room.leave', cb => {
        room.leave(socket)
            .then(_ => room.join(socket, dataMap.lobby))
            .then(_ => cb(responseHandler(true, resCode.success, null)))
            .catch(err => cb(errorHandler(err)))
    })

    socket.on('room.create', (roomDto, cb) => {
        room.leave(socket)
            .then(_ => room.create(socket, roomDto))
            .then(nextRoomId => {
                room.join(socket, nextRoomId)
                    .then(_ => cb(responseHandler(true, resCode.success, nextRoomId)))
            })
            .catch(err => cb(errorHandler(err)))
    })

    socket.on('room.info', cb => {
        room.info(socket)
            .then(info => cb(responseHandler(true, resCode.success, info)))
            .catch(err => cb(errorHandler(err)))
    })

    socket.on('room.update', (roomDto, cb) => {
        room.update(socket, roomDto)
            .then(_ => cb(responseHandler(true, resCode.success, null)))
            .catch(err => cb(errorHandler(err)))
    })

    socket.on('room.list', cb => {
        room.list(socket)
            .then(list => cb(responseHandler(true, resCode.success, list)))
            .catch(err => cb(errorHandler(err)))
    })
}