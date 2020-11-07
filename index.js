var rooms = require('./models/rooms')
var profiles = require('./models/profiles')

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
// const redisClient = redis.createClient();

const WatchJS = require("melanke-watchjs")
const watch = WatchJS.watch;
// var unwatch = WatchJS.unwatch;
// var callWatchers = WatchJS.callWatchers;

// important: this [cors] must come before Router
const cors = require('cors');
// const router = express.Router();
const router = require('./routes/router')
const app = express();
app.set('port', process.env.PORT || 3000);
// app.set('view engine', 'html');
app.set('view engine', 'ejs');
// app.set('views', __dirname + '/');
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

// app.use('/html', static(__dirname + '/html'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use('/', router);

// router.get('/', (req, res) => {
//     // console.log(req.isAuthenticated())
//     // console.log(req.session.passport)
//     // res.sendFile(path.join(__dirname + '/html/chat.html'));
//     // res.sendFile(__dirname + '/views/index.ejs');
//     // res.render('index', { locals: { username: req.session.key ? req.session.passport.user : null } })
//     // res.render('index', { userId: req.isAuthenticated() ? req.session.passport.user : 0 })
//     res.sendFile(__dirname + '/chatLobby.html')
// })

router.post('/profile/register', (req, res) => {
    let username = req.body.username
    let password = req.body.password

    bcrypt
        .genSalt(saltRounds)
        .then(salt => {
            return bcrypt.hash(password, salt)
        })
        .then(hash => {
            profiles[username] = {
                id: username,
                pw: hash,
                nick: null,
                img: null,
                status: -1,
                friendsList: [],
                banList: [],
                socket_id: null,
            }
            // console.log('inside index profiles', profiles)
            res.redirect('/')
        })
        .catch(err => console.error(err.message))

    // bcrypt.genSalt(saltRounds, (err, salt) => {
    //     bcrypt.hash(password, salt, (err, hash) => {
    //         // hashed password
    //         if (err) throw new Error(err)
    //         profiles[username] = {
    //             id: username,
    //             pw: hash,
    //             nick: null,
    //             img: null,
    //             status: -1,
    //             friendsList: [],
    //             banList: [],
    //             socket_id: null,
    //         }
    //         // console.log(profiles)
    //         res.redirect('/')
    //     })
    // })
})

router.post('/profile/signin', passport.authenticate('local', {
    failureRedirect: '/profile/failure',
    failureFlash: true
}), (req, res) => {
    console.log('came from serialization maybe?')
    console.log(req.session.passport)
    userMap[req.user.id] = null;
    // res.sendFile(__dirname + '/chatLobby.html')
    res.render('chatLobby', {
        basicInfo: {
            userId: req.session.passport.user,
            rooms: rooms,
        }
    })

    // req.session.save(function () {
    //     // console.log(req.user)
    //     userMap[req.user.id] = null;
    //     // res.render('chat', { userId: req.session.passport.user ? req.session.passport.user : null })
    //     res.sendFile(__dirname + 'chatLobby.html')
    // })
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

var chatLogs = [];
var userMap = {};
var socketMap = {};
var newRoomIdNum = 4;

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
const io = socketio.listen(server);

watch(rooms, () => {
    console.log('[rooms]changes made')
    io.to(0).emit('room.list.response', rooms)
})
io.use((socket, next) => {
    console.log('io middle')
    sessionIntoRedis(socket.request, socket.request.res || {}, next);
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
    console.log('userMap', userMap)
    console.log('socket.req.session', socket.request.session)
    userMap[socket.request.session.passport.user] = socket.id
    socketMap[socket.id] = socket.request.session.passport.user
    socket.join(0, () => {
        // rooms[0].roomCnt = io.sockets.adapter.rooms[0].length
        // profiles[socketMap[socket.id]].status = 0;
        console.log('joined')
    });
    console.log(socketMap[socket.id] + ' has been connected')

    // socket.use('chat',(packet,next)=>{

    socket.on('profile.list', () => {
        socket.emit('profile.list.response', io.sockets.connected)
    })

    socket.on('room.create', roomDTO => {
        console.log(socket.request.session.passport)
        console.log('new room created')
        roomDTO.roomID = newRoomIdNum++
        rooms[roomDTO.roomID] = roomDTO
        rooms.cnt++
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
                profiles[socketMap[socket.id]].status = targetId;
                io.to(targetId).emit('system.welcome', { packet: socketMap[socket.id], timestamp: timestamp });
            });
        } else socket.emit('room.join.response', false);
    })
    socket.on('chat.public', chatDTO => {
        // messages.push({ 'name': msg.name, 'message': msg.txt });
        if (!chatDTO.to) io.to(profiles[chatDTO.from].status).emit('chat.public', { packet: chatDTO, timestamp: timestamp });
    })
    socket.on('room.leave', roomDTO => {
        let targetId = roomDTO.roomID
        socket.leave(targetId, () => {
            rooms[targetId].roomCnt--;
            profiles[socketMap[socket.id]].status = 0;
            io.to(targetId).emit('system.farewell', { packet: socketMap[socket.id], timestamp: timestamp })
        })
    })
    // socket.on('disconnect', () => {
    //     let currRoomId = profiles[socketMap[socket.id]].status;
    //     // if this socket is in a room, need to leave it as well        
    //     if (currRoomId) {
    //         rooms[currRoomId].roomCnt--;
    //         profiles[socketMap[socket.id]].status = 0;
    //         io.to(currRoomId).emit('system.farewell', { packet: socketMap[socket.id], timestamp: timestamp })
    //     }
    //     console.log(socketMap[socket.id] + ' has been disconnected');
    // })
})
