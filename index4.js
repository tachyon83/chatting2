// const path = require('path'); // OS-independent
const http = require('http');
const express = require('express');
const passport = require('passport');
const passportConfig = require('./config/passportConfig');
const webSettings = require('./config/webSettings')
const responseHandler = require('./utils/responseHandler')
const errorHandler = require('./utils/errorHandler')
const cors = require('cors');
const app = express();

app.use(express.json())
app.set('port', process.env.PORT || 3000);
app.use(webSettings.sessionRedisMiddleware)
// important: this [cors] must come before Router
app.use(cors(webSettings.corsSettings));
app.use(passport.initialize());
app.use(passport.session());
passportConfig()

const server = http.createServer(app);
const socketio = require('socket.io');
// const io = socketio.listen(server, webSettings.socketSettings);
const io = socketio(server, webSettings.socketSettings);
io.use((socket, next) => {
    // this is just damn important!
    webSettings.sessionRedisMiddleware(socket.request, socket.request.res || {}, next);
})

const redisClient = require('./config/redisClient')

io.use((socket, next) => {
    let currTime = new Date();
    let timeStamp = currTime.getHours() + ':' + currTime.getMinutes();
    console.log('[IO Entry]: ', timeStamp)
    console.log()

    redisClient.get('sess:' + socket.request.session.id, (err, value) => {
        if (err) {
            err.reason = 'dbError'
            socket.emit('system.error', errorHandler(err))
        }
        if (!value) {
            err = new Error()
            err.reason = 'noInfo'
            socket.emit('system.error', errorHandler(err))
        }
        else next()
    })
})

const dataMap = require('./config/dataMap')
const resCode = require('./config/resCode')
const sessionToSocket = require('./utils/sessionToSocket')
const room = require('./controllers/roomController2')
const eventEmitter = require('./config/eventEmitter')

// console.log(Object.keys(io.sockets.adapter.rooms))
// console.log(io.sockets.adapter.rooms['0'].sockets)
// console.log(Object.keys(io.sockets.adapter.rooms['0'].sockets))

eventEmitter.on('room.list.refresh', roomDto => {
    console.log('io.sockets', Object.keys(io.sockets))
    console.log('io.sockets.adapter', Object.keys(io.sockets.adapter))
    console.log('io.sockets.adapter.rooms', Object.keys(io.sockets.adapter.rooms))
    console.log('io.sockets.adapter.rooms', io.sockets.adapter.rooms)
    // console.log(io.sockets.adapter.rooms['0'].sockets)
    io.in(dataMap.lobby).emit('room.list.refresh', responseHandler(true, resCode.success, roomDto))
})

io.on('connection', async socket => {

    // const room = new roomController(io, socket)

    // eventEmitter.on('room.list.refresh', roomDto => {
    //     // console.log('io.adap.rooms', io.adapter.rooms)
    //     // console.log('io.nsps.adap.rooms', io.nsps['/'].adapter.rooms)
    //     // console.log('io.sockets', Object.keys(io.sockets))
    //     // console.log('io.sockets._events', Object.keys(io.sockets._events))
    //     // console.log('io.sockets.sockets', Object.keys(io.sockets.sockets))
    //     // console.log('io.sockets.connected', Object.keys(io.sockets.connected))
    //     console.log('io.sockets.adapter', Object.keys(io.sockets.adapter))
    //     console.log('io.sockets.adapter.rooms', Object.keys(io.sockets.adapter.rooms))
    //     // console.log(io.sockets.adapter.rooms['0'].sockets)
    //     io.in(dataMap.lobby).emit('room.list.refresh', responseHandler(true, resCode.success, roomDto))
    // })

    console.log('[IO]: A New Socket Connected!')
    console.log('[IO]: Session ID in this Socket:', socket.request.session.id)
    console.log('[IO]: Socket ID:', socket.id)
    console.log()

    // 아래 과정에서 에러 발생시, 중단 처리 관련하여 고민 필요
    await sessionToSocket(socket.request.session.id, socket)
        // .then(() => {
        //     console.log('[IO]: Now Joining Lobby...')
        //     console.log()
        //     room.join(socket,dataMap.lobby)
        // })
        .catch(err => {
            console.log(err)
            console.log()
            socket.emit('system.error', errorHandler(err))
            // need to disconnect this socket?
        })
    console.log('[IO]: Now Joining Lobby...')
    console.log()
    await room.join(socket, dataMap.lobby)
    console.log(io.sockets.adapter.rooms)

    socket.on('abc', () => {
        console.log('abc test !')
    })

    socket.on('disconnecting', async reason => {
        // 방을 나가고 (0번방에서도 나가기)
        // onlineUsers, sessionMap등등 정리
        // session.destroy

        console.log('[IO]: Disconnecting Reason', reason);
        console.log()

        if (reason === 'server namespace disconnect' || reason === 'transport close') {
            room.leave(socket)
                .then(() => {
                    console.log('[IO]: This Socket Left a Room or Lobby')
                    console.log()
                    redisClient.hdel(dataMap.onlineUserHm, socket.userId)
                    redisClient.hdel(dataMap.sessionUserMap, socket.request.session.id)

                    socket.request.logOut()
                    socket.request.session.destroy(err => {
                        if (err) return socket.emit('system.error', errorHandler(err))
                        console.log('[IO]:', socket.userId + ' has successfully signed out/disconnected.')
                        console.log()
                    })
                })
                .catch(err => console.log(err))
        }
    })

    require('./controllers/socketEvents/roomEvents2')(socket)
    // require('./socketEvents/chatEvents')(socket)
    // require('./socketEvents/userEvents')(socket)
})



app.use((req, res, next) => {
    console.log()
    console.log('[Current Session ID]: ', req.session.id)
    let currTime = new Date();
    let timeStamp = currTime.getHours() + ':' + currTime.getMinutes();
    console.log('[HTTP CALL]: ', timeStamp)
    next()
})
app.use('/user', require('./routes/user')(io));


// 404
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.reason = 'noPage'
    err.status = 404;
    next(err);
});
// error handler
app.use(function (err, req, res, next) {
    console.log('reached the end...404 or 500')
    console.log(err)
    console.log()
    res.json(errorHandler(err))
});


server.listen(app.get('port'), () => {
    console.log('http://localhost:%d', app.get('port'));
});
