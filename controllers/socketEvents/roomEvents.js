// acts as a router

// const roomController = require('../roomController')
const resCode = require('../../config/resCode')
const responseHandler = require('../../utils/responseHandler')
const errorHandler = require('../../utils/errorHandler')
const dataMap = require('../../config/dataMap')


module.exports = room => {
    // const room = new roomController(socket)

    room.socket.on('room.join', (roomId, cb) => {
        console.log('roomId in roomEvents', roomId)
        room.leave()
            .then(_ => room.isJoinable(roomId))
            .then(_ => room.join(roomId))
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
            .then(nextRoomId => {
                room.join(nextRoomId)
                    .then(_ => cb(responseHandler(true, resCode.success, nextRoomId)))
            })
            .catch(err => cb(errorHandler(err)))
    })

    room.socket.on('room.update', (roomDto, cb) => {
        room.update(roomDto)
            .then(_ => cb(responseHandler(true, resCode.success, null)))
            .catch(err => cb(errorHandler(err)))
    })

    room.socket.on('room.list', cb => {
        console.log('room.list event!')
        room.list()
            .then(list => cb(responseHandler(true, resCode.success, list)))
            .catch(err => cb(errorHandler(err)))
    })
}