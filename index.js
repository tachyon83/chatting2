var rooms = require('./models/rooms')
var roomsCnt = {
    cnt: Object.keys(rooms).length + 1
}
var users = require('./models/users').users
const addNewUser = require('./models/users').addNewUser
var roomUsers = {
    1: [],
    2: [],
}
var onlineUsers = {}
var onlineUsersCnt = {
    cnt: Object.keys(onlineUsers).length + 1
}

// const url = require('url');
// const path = require('path'); // OS-independent
const http = require('http');
const bodyParser = require('body-parser')
// const static = require('serve-static');
const express = require('express');
const session = require('express-session');

const passport = require('passport');
const passportConfig = require('./config/passportConfig');
const flash = require('connect-flash')

// connect-redis version must be somewhere around 3.#.#
// now upgraded to 5.0.0
// const redis = require('redis')
const RedisStore = require("connect-redis")(session);
const redisClient = require('./config/redisClient');

const WatchJS = require("melanke-watchjs")
const watch = WatchJS.watch;
// var unwatch = WatchJS.unwatch;
// var callWatchers = WatchJS.callWatchers;

// important: this [cors] must come before Router
const cors = require('cors');
const router = express.Router();
// const router = require('./routes/router')
const app = express();
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/html');

const sessionIntoRedis = (session({
    secret: 'secret secretary',
    resave: false,
    saveUninitialized: false,
    store: new RedisStore({
        client: redisClient,
        ttl: 30,
        // host: 'localhost',
        // port: 6379,
        // prefix: 'session',
        // db: 0,
        // saveUninitialized: false,
        // resave: false
    }),
}))

// app.use(session({
//     store: new RedisStore({ client: redisClient }),
//     secret: 'keyboard cat',
//     resave: false,
// }))

const bcrypt = require('bcrypt');
const saltRounds = 10

app.use(passport.initialize());
app.use(passport.session());
app.use(sessionIntoRedis)
// flash는 내부적으로 session을 이용하기 때문에 session 보다 아래쪽에서 미들웨어를 설치
app.use(flash())
passportConfig();

app.use('/html', express.static(__dirname + '/html'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use('/', router);


// 회원가입시에 users에 등록했을테니
// 로그인시에는 users에 빼온다, 그리고 users에서 status변경
const signInProcess = user => {
    console.log('inside sign in process')

    console.log('user in signInProcess', user)
    console.log(users[user].status)
    users[user].status = 0
    onlineUsers[user] = users[user]
    onlineUsersCnt.cnt++;
}

const checkIfAlreadySignedIn = (req, res, next) => {

    /*
        checkIfAlreadySignedIn 에서 아래 사항 처리
            현재 로그인되어있는지 확인
            로그인되어있을 시 (아이디와 방 위치 보여주기) 재접여부 확인 ('index'에서)
            재접안하면 어디로 갈것인지? (일단은 대기실로 처리)
            재접하면 해당 방으로 이동(방이 없으면 대기실로)
            근데 여기서 또...원래 대기실이었으면 물어볼거 없이 그냥
            바로 대기실로 가게 할지..? (일단은 그렇게 처리함)
        
            로그인된 세션이 있고 대기실에 있었다면 바로 lobby로 빼준다.
            그렇지 않으면 'index'로 이동
            프론트에서 [이전 위치]를 보여주거나 로그인/회원가입 화면 보여주기

    going to be used in both '/' and '/user/signin'
    the result would be two ways: lobby or exist
    next() will be for the user not signed in before !

    in '/user/signin', this middleware comes after passport
    two cases: 
    - case 1. from a different session(browser)
    - case 2. from the same session, via a different tab

    case 1: 
        '/'에서는 기존 로그인된 다른 세션있어도 로그인을 새로 해야하는 상황
        '/user/signin'에서도 마찬가지

    case 2:
        '/'에서는 바로 대기실로 가거나 원래 있던 채팅방으로 복귀할 지 묻는 창
        (기존 세션 또는 소켓은 종료)
        원래 대기실이었으면 그냥 바로 대기실로
        case 2에서는 원래 로그인된 상태였다면
        '/user/signin/'으로 들어가는 일이 없다. [post]만 받는다

    같은 세션에서 왔다면, 기존 로그인이 있을 때 /user/signin으로 가는 경우는 없으므로
    '/user/signin'으로 들어온 경우에는 다른 세션에서 들어왔다는 것이고,
    로그인 인증을 거쳐야(passport.authenticate를 먼저 거쳐야) 기존 로그인이
    있는지 없는지 확인이 된다.
    */

    console.log('now in the checkif middleware')

    // need to define this basicInfo here otherwise there will be an error in ejs
    res.locals.basicInfo = {
        basicInfo: JSON.stringify({
            userId: null,
            rooms: null,
        })
    }
    let user = null

    /*
        같은 세션에서 '/'로 들어왔을 때, 기존 로그인이 있는지 확인위해
        세션체크가 필요하다.

        하지만 다른 세션에서 'user/signin'으로 들어왔을 때는
        passport를 거쳐서 일단 로그인을 해야한다. 하지만 이때는
        passport를 통해 인증이 되었기에, session체크가
        불필요하다. 그럼에도 불구하고 동일 미들웨어 사용을 위해 남겨두었다.

        그래서 현재의 user가 이전에 있던 유저인지 아니면 새로 로그인한 유저인지
        확인하고 위해 if (onlineUsers.hasOwnProperty(user)) 과정을
        거쳐야 한다.
        새로 들어온 유저라면 next()

        유사하게, '/'를 통해 들어온 기존 유저는
        if (onlineUsers.hasOwnProperty(user)) 과정이 불필요하다.
        하지만 동일 미들웨어 사용을 위해 남겨두었다...

    */
    // if (req.isAuthenticated()) {
    if (req.session.hasOwnProperty('passport')) {
        console.log('this req has already been authenticated')
        user = req.session.passport.user
        console.log('user: ', user)
        if (onlineUsers.hasOwnProperty(user)) {
            if (onlineUsers[user].status != 0) {
                res.locals.basicInfo = {
                    basicInfo: JSON.stringify({
                        userId: user,
                        roomNumber: onlineUsers[user].status,
                    })
                }
                res.render('index', res.locals.basicInfo)
            } else {
                res.locals.basicInfo = {
                    basicInfo: JSON.stringify({
                        userId: user,
                        rooms: rooms,
                    })
                }
                res.render('chatLobby', res.locals.basicInfo)
            }
            return
            // 위에서 index나 lobby로 이동을 시켜주어야 한다. next()가
            // 다를 수 있기 때문.
        } else {
            res.locals.basicInfo = {
                basicInfo: JSON.stringify({
                    userId: user,
                    rooms: rooms,
                })
            }
        }
    }
    next();
}

router.get('/', checkIfAlreadySignedIn, (req, res) => {
    res.render('index', res.locals.basicInfo)
})

router.post('/user/signin', passport.authenticate('local', {
    failureRedirect: '/user/signinpage',
    failureFlash: true
}), checkIfAlreadySignedIn, (req, res) => {
    console.log('came from serialization maybe?')
    console.log('session ID', req.session.id)
    console.log('passport after router.post(profile.signin),passport.authenticate', req.session.passport)
    console.log(res.locals.basicInfo)

    signInProcess(req.session.passport.user)
    res.render('chatLobby', res.locals.basicInfo)
})

router.post('/user/signup', (req, res) => {
    let username = req.body.username
    let password = req.body.password

    bcrypt
        .genSalt(saltRounds)
        .then(salt => {
            return bcrypt.hash(password, salt)
        })
        .then(hash => {
            users[username] = addNewUser(username, hash)
            // console.log('inside index users', users)
            res.redirect('/')
        })
        .catch(err => console.error(err.message))

    // bcrypt.genSalt(saltRounds, (err, salt) => {
    //     bcrypt.hash(password, salt, (err, hash) => {
    //         // hashed password
    //         if (err) throw new Error(err)
    //         users[username] = {
    //             id: username,
    //             pw: hash,
    //             nick: null,
    //             img: null,
    //             status: -1,
    //             friendsList: [],
    //             banList: [],
    //             socket_id: null,
    //         }
    //         // console.log(users)
    //         res.redirect('/')
    //     })
    // })
})

router.get('/user/signinpage', (req, res) => {
    res.render('signin')
})

// router.get('/onlineUsers/list', (req, res) => {
//     res.json(io.sockets.connected)
// })
router.get('/signout', (req, res) => {
    if (req.isAuthenticated()) {
        // console.log(io.sockets);
        console.log('connected list', io.sockets.connected)
        console.log('connected list2', io.sockets)
        for (let eSocketId of Object.keys(io.sockets.connected)) {
            console.log(eSocketId)
            if (eSocketId == userMap[req.session.passport.user]) {
                console.log('found')
                console.log(io.sockets.connected[eSocketId])
                io.sockets.connected[eSocketId].disconnect();
            }
        }

        // difference between req.session.destroy and req.logout

        req.session.destroy(() => {
            console.log('destroyed')
            console.log(req.session)
            res.redirect('/')
        })
        // req.logout();
        // req.session.save(() => {
        //     // res.redirect('/')
        //     res.render('index', { userId: 0 })
        // })
    } else res.render('index', { userId: 0 })
})

// chat messages, log-in & out logs
// friend list, group list, room list
// person info (id,chat_room_id, room, group, level )

// important! middleware 사용법
// app.get('/profile/success',middleware,function(req,res){
//     res.send(req.user);
// })
// function middleware(req,res,next){
//     if(req.isAuthenticated())return next();
//     res.sendFile(__dirname + '/html/signin.html');
// }

const server = http.createServer(app);
server.listen(app.get('port'), () => {
    console.log('http://localhost:%d', app.get('port'));
});

const socketio = require('socket.io');
const { json } = require('express')
const io = socketio.listen(server);

watch(roomsCnt, () => {
    console.log('watched: a new room made')
    io.to(0).emit('room.list.response', rooms)
})
watch(rooms, () => {
    console.log('watched: [rooms]changes made')
    io.to(0).emit('room.list.response', rooms)
})
// watch(rooms, [rooms, roomCnt], () => {
//     console.log('watched: [rooms]changes made')
//     io.to(0).emit('room.list.response', rooms)
// })

io.use((socket, next) => {
    console.log('io middle')
    sessionIntoRedis(socket.request, socket.request.res || {}, next);
})
io.use((socket, next) => {
    redisClient.get('sess:' + socket.request.session.id, (err, value) => {
        if (err) throw err;
        console.log('redisClient.get', value)
        console.log('socket.session.id', socket.request.session.id)
    })
    next();
})

var timestamp = null;

io.on('connection', (socket) => {

    socket.use((packet, next) => {
        let currTime = new Date();
        timestamp = currTime.getHours() + ':' + currTime.getMinutes();
        if (socket.request.session.passport) return next();
        socket.disconnect();
        console.log('this session is expired')
    })
    // console.log('userMap', userMap)
    // console.log('socket.req.session', socket.request.session)

    // socket.name might be able to replace socketMap
    console.log('socket.name', socket.name)
    // userMap[socket.request.session.passport.user] = socket.id
    // socketMap[socket.id] = socket.request.session.passport.user
    socket.join(0, () => {
        // rooms[0].roomCnt = io.sockets.adapter.rooms[0].length
        // users[socketMap[socket.id]].status = 0;
        console.log('joined')
    });
    // console.log(socketMap[socket.id] + ' has been connected')

    // socket.use('chat',(packet,next)=>{

    socket.on('profile.list', () => {
        socket.emit('profile.list.response', io.sockets.connected)
    })

    socket.on('room.create', roomDTO => {
        console.log('passport in room.create', socket.request.session.passport)
        console.log('new room created')
        console.log('rooms inside socket.on.room.create', rooms)
        roomDTO.roomID = roomsCnt.cnt
        rooms[roomDTO.roomID] = roomDTO
        console.log(rooms)
        roomsCnt.cnt++
        console.log(roomsCnt.cnt)
    })
    socket.on('room.join', roomDTO => {
        let targetId = roomDTO.roomID
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
            // rooms[roomDTO.roomID].roomCnt++;

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
        let targetId = roomDTO.roomID
        socket.leave(targetId, () => {
            rooms[targetId].roomCnt--;
            users[socketMap[socket.id]].status = 0;
            io.to(targetId).emit('system.farewell', { packet: socketMap[socket.id], timestamp: timestamp })
        })
    })
    // socket.on('disconnect', () => {
    //     let currRoomId = users[socketMap[socket.id]].status;
    //     // if this socket is in a room, need to leave it as well        
    //     if (currRoomId) {
    //         rooms[currRoomId].roomCnt--;
    //         users[socketMap[socket.id]].status = 0;
    //         io.to(currRoomId).emit('system.farewell', { packet: socketMap[socket.id], timestamp: timestamp })
    //     }
    //     console.log(socketMap[socket.id] + ' has been disconnected');
    // })
})
