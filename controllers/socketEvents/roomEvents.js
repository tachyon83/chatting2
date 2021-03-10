// acts as a router

// const roomController = require('../roomController')
const resCode = require('../../config/resCode')
const responseHandler = require('../../utils/responseHandler')
const errorHandler = require('../../utils/errorHandler')
const dataMap = require('../../config/dataMap')


module.exports = room => {
    // const room = new roomController(socket)

    room.socket.on('room.join', (roomDto, cb) => {
        room.leave()
            .then(_ => room.isJoinable(roomDto))
            .then(async joinable => {
                if (!joinable) return cb(responseHandler(false, resCode.wrong, null))
                return await room.join(roomDto.roomId)
            })
            .then(_ => cb(responseHandler(true, resCode.success, null)))
            .catch(err => cb(errorHandler(err)))
    })

    room.socket.on('room.leave', cb => {
        room.leave()
            .then(_ => room.join(dataMap.lobby))
            .then(_ => cb(responseHandler(true, resCode.success, null)))
            .catch(err => cb(errorHandler(err)))
    })

    room.socket.on('room.create', (roomDto, cb) => {
        room.leave()
            .then(_ => room.create(roomDto))
            .then(room.join)
            .then(nextRoomId => cb(responseHandler(true, resCode.success, nextRoomId)))
            .catch(err => cb(errorHandler(err)))
    })

    room.socket.on('room.info', cb => {
        room.info()
            .then(info => cb(responseHandler(true, resCode.success, info)))
            .catch(err => cb(errorHandler(err)))
    })

    room.socket.on('room.update', (roomDto, cb) => {
        room.update(roomDto)
            .then(_ => cb(responseHandler(true, resCode.success, null)))
            .catch(err => cb(errorHandler(err)))
    })

    room.socket.on('room.list', cb => {
        room.list()
            .then(list => cb(responseHandler(true, resCode.success, list)))
            .catch(err => cb(errorHandler(err)))
    })
}