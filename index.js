// onlineUsers로 내려받아서 관리하고, 
// 일정 주기로 DB에 업뎃하는 방식
// onlineUsers가 Redis로 관리되어야 하는 대표적인 형태

var rooms = require('./models/rooms')
var roomsCnt = {
    cnt: Object.keys(rooms).length + 1
}
// var users = require('./models/users').users
// const addNewUser = require('./models/users').addNewUser


////////////////// data map //////////////////
// var socketIds = {}
// 0번방은 없다
// var roomUsers = {
//     1: {},
//     2: {},
// }
// var onlineUsers = {}
// var onlineUsersCnt = {
//     cnt: Object.keys(onlineUsers).length + 1
// }
//////////////////////////////////////////////

// const url = require('url');
// const path = require('path'); // OS-independent
const http = require('http');
const cookieParser = require('cookie-parser')
const express = require('express');
const session = require('express-session');
const passport = require('passport');

// connect-redis version must be somewhere around 3.#.#
// now upgraded to 5.0.0
// const redis = require('redis')
const RedisStore = require("connect-redis")(session);
const redisClient = require('./config/redisClient');

const WatchJS = require("melanke-watchjs")
const watch = WatchJS.watch;

// important: this [cors] must come before Router
const cors = require('cors');
// const router = express.Router();
const app = express();
app.set('port', process.env.PORT || 3000);

const sessionIntoRedis = (session({
    httpOnly: true, //cannot access via javascript/console
    secure: true, //https only
    secret: 'secret secretary',
    resave: false,
    saveUninitialized: false,
    store: new RedisStore({
        client: redisClient,
        ttl: 60 * 60,
        // host: 'localhost',
        // port: 6379,
        // prefix: 'session',
        // db: 0,
        // saveUninitialized: false,
        // resave: false
    }),
    cookie: (process.env.NODE_ENV === 'production') ? {
        httpOnly: true,
        // path: corsSettings.origin,
        // sameSite: 'lax',
        sameSite: 'none',
        secure: true,
        maxAge: 1000 * 60 * 10,
    } : null,
}))

app.use(express.json())
app.use(cors({
    origin: true,
    credentials: true,
    preflightContinue: true,
}));
app.use(sessionIntoRedis)
app.use(cookieParser())
app.use(passport.initialize());
app.use(passport.session());

app.use('/user', require('./routes/user'));

// app.use(cookieParser)
// app.use((req, res, next) => {
//     console.log('app middle session id', req.session.id)
//     // this is just damn important!
//     sessionIntoRedis(req, res, next);
// })
// flash는 내부적으로 session을 이용하기 때문에 session 보다 아래쪽에서 미들웨어를 설치
// app.use(flash())
// passportConfig();
// app.use('/html', express.static(__dirname + '/html'));
// app.use(cors())



/*
    users에서 user정보를 가져오고,
    가져오면서 status를 붙여주는 방식.
    onlineUsers에만 status가 있다.
    하지만 이렇게 하면 DB에 다시넣을 때 문제가 된다.

    users에서 이미 status를 갖고 있고,
    이를 레디스에서 관리하는 onlineUsers로 갖고 오는 방식으로 진행하면,
    onlineUsers에서 status가 -1로 갱신된 부분이 DB에 적용 안될 수도 있다.
    일정 주기로 DB에 저장되는데, -1로 갱신 후에는 onlineUsers에서
    삭제되어야 하기 때문이다. 안그러면 onlineUsers에 너무 많은 유저가 쌓일 수 있다.
    (악의적으로 계속 계정 생성 등)

    결론적으로?
    users(DB)에서 갖고 오는 status값은 처음에는 아무 의미가 없다.
    그 값은 아마도 처음에 갖고 올때, -1에서 바꾸지 않는게 안전
    그래도 레디스->DB 주기적 저장 때 0이 들어갈 수 있다?
    그거는 방 나갈 때 -1/0 다르게 저장함으로써 관리 가능

    아니면 대기실을 별도의 namespace로 관리...?

*/


// 새로운 세션에서 다시 같은 방에 들어가는 경우를 위한
// 방 리조인 가능 여부 판단 함수 필요


/*
    소켓이 끊어지면 모든 정보 업데이트 필요!
    방을 먼저 나가고 나서 업데이트 한다.
    onlineUsers등을 통해 관련 정보 추출 필요

    1. signout버튼 클릭을 통한 로그아웃 (소켓 이벤트)
        해당 이벤트가 들어오면 socket.disconnect안에서 콜백으로 방 나가기 함수 처리
        프론트에서 소켓 끊고 메인페이지로 리다이렉트

    2. 브라우저 닫기 (소켓 끊어짐)
        위의 1번과 마찬가지로 똑같이 처리.

    3. 방 나가기
        방 나가기 함수만 부르기

*/


// router.get('/user/signout/:user', (req, res) => {
//     let user = req.params.user
//     console.log(user)
//     let socketId = onlineUsers[user].socketId
//     let socket = io.sockets.connected[socketId]
//     let session = req.session
//     let socketSession = socket.request.session

//     socket.disconnect();
//     console.log('socket disconnected')
//     req.session.destroy(_ => {
//         signOutProcess(user);
//         if (session.id != socketSession.id) socketSession.destroy(_ => {
//             // res.render('index', { user: null })
//         })
//         // else res.render('index', { user: null })
//     })
// })

// 아래의 라우터는 사용하지 않는다.
// 로그아웃은 소켓 이벤트로만 처리한다!
// router.get('/user/signout', (req, res) => {

//     /*
//         소켓이 걸려있는 로비나 채팅룸에서는 창이 이동하며 소켓이 끊어지기에,
//         socket.on('disconnect')이벤트를 활용해 처리할 수 있지만,

//         다른 세션에서 접속하여 signout을 할때는 이전 소켓이 살아있게 된다.
//         그래서 disconnect이벤트를 통해 소켓관련 정리도 해야하지만,
//         signout경로에서도 (signoutProcess) 체크를 똑같이 해주어야 한다. 
//     */



//     if (req.isAuthenticated()) {
//         // console.log(io.sockets);
//         console.log('connected list', io.sockets.connected)
//         console.log('connected list2', io.sockets)
//         for (let eSocketId of Object.keys(io.sockets.connected)) {
//             console.log(eSocketId)
//             if (eSocketId == userMap[req.session.passport.user]) {
//                 console.log('found')
//                 console.log(io.sockets.connected[eSocketId])
//                 io.sockets.connected[eSocketId].disconnect();
//             }
//         }

//         // difference between req.session.destroy and req.logout

//         req.session.destroy(() => {
//             console.log('destroyed')
//             console.log(req.session)
//             res.redirect('/')
//         })
//         // req.logout();
//         // req.session.save(() => {
//         //     // res.redirect('/')
//         //     res.render('index', { userId: 0 })
//         // })
//     } else res.render('index', { userId: 0 })
// })

// chat messages, log-in & out logs
// friend list, group list, room list
// person info (id,chat_room_id, room, group, level )

// important! middleware 사용법
// app.get('/profile/success',middleware,function(req,res){
//     res.send(req.user);
// })


const server = http.createServer(app);
server.listen(app.get('port'), () => {
    console.log('http://localhost:%d', app.get('port'));
});

const socketio = require('socket.io');

const io = socketio.listen(server, {
    cors: {
        origin: true,
        credentials: true,
    }
});

// watch(roomsCnt, () => {
//     console.log('watched: a new room made')
//     // console.log('io.in(0)', io.in(0))
//     io.to(0).emit('room.list.response', rooms)
//     console.log('maybe emitted')
// })
// watch(rooms, () => {
//     console.log('watched: [rooms]changes made')
//     io.to(0).emit('room.list.response', rooms)
// })
// watch(rooms, [rooms, roomCnt], () => {
//     console.log('watched: [rooms]changes made')
//     io.to(0).emit('room.list.response', rooms)
// })

io.use((socket, next) => {
    console.log('io middle socket id: ', socket.id)
    // this is just damn important!
    sessionIntoRedis(socket.request, socket.request.res || {}, next);
})
// io.use((socket, next) => {
//     // console.log(socket.id)
//     redisClient.get('sess:' + socket.request.session.id, (err, value) => {
//         if (err) throw err;
//         console.log('redisClient.get', value)
//         console.log('session in socket', socket.request.session.id)
//     })
//     next();
// })

// var timestamp = null;

const fromSessionIdToSocketConnector = (sessionId, socket) => {
    return new Promise((resolve, reject) => {
        console.log(sessionId)
        redisClient.hget('sessionMap', sessionId, (err, userId) => {
            if (err) reject(err)
            socket.userId = userId
            console.log('1st hget userId', userId)
            redisClient.hget('onlineUsers', userId, (err, user) => {
                if (err) reject(err)
                user = JSON.parse(user)
                user.socketId = socket.id
                console.log('2nd hget user', user)
                redisClient.hmset('onlineUsers', {
                    [userId]: JSON.stringify(user)
                })
                resolve()
            })
        })
    })
}

io.on('connection', socket => {
    // sessionMap, onlineUsers
    // 아래 과정에서 에러 발생시, 중단 처리 관련하여 고민 필요
    fromSessionIdToSocketConnector(socket.request.session.id, socket)
        .then(() => {
            console.log('finally a socket is connected and ready to be used!');
            socket.emit('test', rooms)
            socket.join(0, () => {
                redisClient.sadd('0', socket.userId)
                socket.pos = 0
                console.log('joined 0 and in standby after login')
            })
        })
        .catch(err => console.log(err))

    // socketIds[socket.request.headers.cookie] = socket.id
    //     io.sockets.connected[socketId].emit('test', rooms)
    //     io.sockets.connected[socketId].join(0, () => {
    //         console.log('joined and in standby after login')
    //         res.json({ response: member.id, })
    //     })

    socket.use((packet, next) => {
        let currTime = new Date();
        this.timestamp = currTime.getHours() + ':' + currTime.getMinutes();
        // if (socket.request.session.passport) return next();
        // socket.disconnect();
        // console.log('this session is expired')
        if (socket.userId) {
            console.log('this socket is authenticated')
            next()
        }
    })

    // socket.join(socket.request.session.currRoom, () => {
    // socket.join(0, () => {
    //     // rooms[0].roomCnt = io.sockets.adapter.rooms[0].length
    //     // users[socketMap[socket.id]].status = 0;
    //     console.log('joined')
    //     // console.log('io.sockets', io.sockets)
    // });
    // console.log(socketMap[socket.id] + ' has been connected')

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
})