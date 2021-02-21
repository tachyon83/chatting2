module.exports = {
    // roomUsers:'roomUserHm',
    lobby: '0',
    onlineUserHm: 'onlineUserHm',
    sessionUserMap: 'sessionUserMap',
    roomInfoHm: 'roomInfoHm',
    nextRoomId: 'nextRoomId',
    groupIndicator: 'Group:',
    linesToRead: 10,
    // oldRoomIdQueue:'oldRoomIdQueue',
    // chatLogs:'chatLogs',
}

// '15chat'=[ chat1, chat2, chat3 ],

// socket.userId, socket.pos, user,pos, user.socketId
// hmset('onlineUserHm','paul',JSON.stringify({ }))
// hget('onlineUserHm','paul',(err,value)=>{ })
// set / get nextRoomId

// hmset, hget, hdel, hkeys
// sadd, sismember, srem, scard, smembers, srandmember, spop
// push, lpush, lpop, rpush, rpop, llen, lrange 0 -1, lrange 0 2 (3 of them)
// stack by rpush, read by rpop, save in db by lrange

// right after someone leaves a room, his socket.pos and user.pos are not changed
// they will be updated only when they enter lobby or another room