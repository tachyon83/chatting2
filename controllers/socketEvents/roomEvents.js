// acts as a router

const room = require('../roomController')
const resCode = require('../../config/resCode')
const responseHandler = require('../../utils/responseHandler')
const errorHandler = require('../../utils/errorHandler')
const dataMap = require('../../config/dataMap')


module.exports = socket => {

    socket.on('room.join', (roomId, cb) => {
        room.leave(socket)
            .then(leaveResult => {
                if (leaveResult) {
                    room.isJoinable(roomId)
                        .then(isJoinableResult => {
                            if (isJoinableResult) {
                                room.join(socket, roomId)
                                    .then(joinResult => {
                                        if (joinResult) cb(responseHandler(joinResult, resCode.success, null))
                                    })
                            }
                        })
                }
                else cb(responseHandler(leaveResult, resCode.error, null))
            })
            .catch(err => cb(errorHandler(err)))

    })

    socket.on('room.leave', cb => {
        room.leave(socket)
            .then(leaveResult => {
                if (leaveResult) {
                    room.join(socket, dataMap.lobby)
                        .then(joinResult => {
                            if (joinResult) cb(responseHandler(joinResult, resCode.success, null))
                        })
                }
                else cb(responseHandler(leaveResult, resCode.error, null))
            })
            .catch(err => cb(errorHandler(err)))
    })

    socket.on('room.create', (roomDto, cb) => {
        room.leave(socket)
            .then(leaveResult => {
                if (leaveResult) {
                    room.create(socket, roomDto)
                        .then(nextRoomId => {
                            if (nextRoomId) {
                                room.join(socket, nextRoomId)
                                    .then(joinResult => {
                                        if (joinResult) cb(responseHandler(joinResult, resCode.success, null))
                                        else cb(responseHandler(joinResult, resCode.error, null))
                                    })
                            }
                            else cb(responseHandler(leaveResult, resCode.error, null))
                        })
                }
                else cb(responseHandler(leaveResult, resCode.error, null))
            })
            .catch(err => cb(errorHandler(err)))
    })

    socket.on('room.update', (roomDto, cb) => {
        room.update(socket, roomDto)
            .then(updateResult => {
                if (updateResult) cb(responseHandler(updateResult, resCode.success, null))
                else cb(responseHandler(updateResult, resCode.error, null))
            })
            .catch(err => cb(errorHandler(err)))
    })

    socket.on('room.list', cb => {
        console.log('room.list event!')
        room.list()
            .then(list => cb(responseHandler(true, resCode.success, list)))
            .catch(err => cb(errorHandler(err)))
    })


}