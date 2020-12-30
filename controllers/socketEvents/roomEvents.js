module.exports = socket => {
    socket.on('profile.list', () => {
        socket.emit('profile.list.response', io.sockets.connected)
    })

    socket.on('room.create', roomDTO => {
        console.log('passport in room.create', socket.request.session.passport)
        console.log('new room created')
        console.log('rooms inside socket.on.room.create', rooms)
        roomDTO.roomId = roomsCnt.cnt
        rooms[roomDTO.roomId] = roomDTO
        console.log(rooms)
        roomsCnt.cnt++
        console.log(roomsCnt.cnt)
    })
    socket.on('room.join', roomDTO => {
        let targetId = roomDTO.roomId
        let target = rooms[targetId]
        // capacity만 지정,
        // 현재 인원은 소켓에서 가져옴 

        // 방에 들어갈 인원이 있고, (방이 존재하지 않거나 방에 현 소켓이 포함되지 않은 경우)
        // 방이 존재하지 않는 경우에 대한 조건은 이후 삭제 필요
        if (target.roomCnt < target.roomCapacity && (!io.sockets.adapter.rooms[targetId] || !io.sockets.adapter.rooms[targetId].sockets[socket.id])) {
            // if (target.roomCnt < target.roomCapacity && !io.sockets.adapter.rooms[targetId].sockets[socket.id]) {
            socket.emit('room.join.response', true);
            // roomCnt등에 synchronized처리
            // 그 외에도 sync처리 부분 확인필요

            // socket의 rooms.length로 읽는 것이 위험할 경우에 대한 대비
            // rooms[roomDTO.roomId].roomCnt++;

            socket.join(targetId, () => {
                rooms[targetId].roomCnt = io.sockets.adapter.rooms[targetId].length
                users[socketMap[socket.id]].status = targetId;
                io.to(targetId).emit('system.welcome', { packet: socketMap[socket.id], timestamp: timestamp });
            });
        } else socket.emit('room.join.response', false);
    })
    socket.on('chat.public', chatDTO => {
        // messages.push({ 'name': msg.name, 'message': msg.txt });
        if (!chatDTO.to) io.to(users[chatDTO.from].status).emit('chat.public', { packet: chatDTO, timestamp: timestamp });
    })
    socket.on('room.leave', roomDTO => {
        let targetId = roomDTO.roomId
        socket.leave(targetId, () => {
            rooms[targetId].roomCnt--;
            users[socketMap[socket.id]].status = 0;
            io.to(targetId).emit('system.farewell', { packet: socketMap[socket.id], timestamp: timestamp })
        })
    })

    // maybe not receivable (the socket cannot receive the event emitted from the same socket itself)
    // socket.on('room.list.response', rooms => {
    //     console.log('the watch room list refresh event actually occurred')
    // })

    // socket.on('system.disconnect', user => {
    //     socket.disconnect();
    //     // return roomLeaveProcess(user)
    //     //     .then(() => { return signOutProcess(user) })
    //     //     .then(() => { return socket.disconnect() })
    //     //     .catch(err => console.error(err.message))
    // })

    // socket.on('manualDisconnect', user => {
    //     let socketId = onlineUsers[user].socketId

    //     io.sockets.connected[socketId].disconnect();

    // })

    socket.on('user.signout', user => {
        // roomLeaveProcess(user)
        // redisClient.hget('onlin')
    })

    socket.on('disconnecting', reason => {
        // 방을 나가고 (0번방에서도 나가기)
        // onlineUsers, sessionMap 정리
        // session.destroy

        // signout시에 socket disconnect를 일으켜서 아래 부분으로 들어오도록 처리
        console.log('disconnecting reason', reason);
        console.log('does this socket still have passport?', socket.request.session.passport)
        if (reason === 'transport close' && socket.request.session) {
            if (socket.pos === 0) {
                socket.leave(0)
                redisClient.srem('0', socket.userId)
                redisClient.hdel('onlineUsers', socket.userId)
                redisClient.hdel('sessionMap', socket.request.session.id)
                socket.request.session.destroy()
            } else {
                socket.leave(socket.pos)
                socket.to(socket.pos).emit('user.leave', socket.userId)
            }
        }
        // console.log(io.sockets.adapter.rooms[0].length)

        // roomLeaveProcess(socket.name).then(_ => {
        //     // if (reason == 'client namespace disconnect') {
        //     if (reason == 'transport close') {
        //         console.log('client disconnect!')
        //         signOutProcess(socket.name)
        //         socket.request.session.destroy()
        //     }
        // })
    })

    // socket.on('disconnect', reason => {
    //     console.log('reason in disconnect', reason)
    // })

    // socket.on('disconnect', () => {
    //     console.log(socket.request.session.passport)
    //     console.log(socket.id);
    //     // console.log(io.sockets.adapter.rooms[0].length)
    // })
    // socket.on('disconnect', () => {
    //     // let currRoomId = users[socketMap[socket.id]].status;
    //     // // if this socket is in a room, need to leave it as well        
    //     // if (currRoomId) {
    //     //     rooms[currRoomId].roomCnt--;
    //     //     users[socketMap[socket.id]].status = 0;
    //     //     io.to(currRoomId).emit('system.farewell', { packet: socketMap[socket.id], timestamp: timestamp })
    //     // }

    //     let user = socket.request.session.passport.user
    //     roomLeaveProcess(user).then(_ => {
    //         signOutProcess(user)
    //         console.log(user + ' has been disconnected');
    //     })

    //     // socket.request.session.destroy(err => {
    //     //     if (err) throw err
    //     // })
    // })
}