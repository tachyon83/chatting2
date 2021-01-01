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

}