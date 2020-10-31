// const url = require('url');
// const path = require('path'); // OS-independent
const http = require('http');
const bodyParser = require('body-parser')
const static = require('serve-static');
const express = require('express');
const session = require('express-session');

const passport = require('passport');
const passportConfig = require('./config/passportTest');
const bcrypt = require('bcrypt');
const flash = require('connect-flash')

const RedisStore = require("connect-redis")(session);
const client = require('./config/redisClient')

// important: this [cors] must come before Router
const cors = require('cors');

// const router = express.Router();
const router = require('./routes/router')
const app = express();
app.set('port', process.env.PORT || 3000);
// app.set('view engine', 'html');
app.set('view engine', 'ejs');
// app.set('views', __dirname + '/views');
app.set('views', __dirname + '/html');

const socketio = require('socket.io')

var rooms = require('./models/rooms')
var profiles = require('./models/profiles')

const sessionIntoRedis = (session({
    secret: 'secret secretary',
    resave: false,
    saveUninitialized: false,
    store: new RedisStore({
        client: client,
        ttl: 30,
        // host: 'localhost',
        // port: 6379,
        // prefix: 'session',
        // db: 0,
        // saveUninitialized: false,
        // resave: false
    }),
}))

app.use(sessionIntoRedis)
app.use(passport.initialize());
app.use(passport.session());

// flash는 내부적으로 session을 이용하기 때문에 session 보다 아래쪽에서 미들웨어를 설치
app.use(flash())
passportConfig();

// app.use('/', static(__dirname + '/html/'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use('/', router);

router.post('/profile/signin', passport.authenticate('local', {
    failureRedirect: '/profile/failure',
    failureFlash: true
}), (req, res) => {
    req.session.save(function () {
        // console.log(req.user)
        userMap[req.user.id] = null;
        res.render('chat', { userId: req.session.passport.user ? req.session.passport.user : null })
    })
})
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
const io = socketio.listen(server);
io.use(function (socket, next) {
    sessionIntoRedis(socket.request, socket.request.res || {}, next);
})

io.on('connection', (socket) => {
    socket.use((packet, next) => {
        let currTime = new Date();
        timestamp = currTime.getHours() + ':' + currTime.getMinutes();
        // console.log(socket.request.session.passport)
        if (socket.request.session.passport) return next();
        socket.disconnect();
        console.log('this session is expired')
    })
    // socket.use(function(socket.request,socket.request.res,next){
    //     if(this.request.session.passport.user)socket.disconnect();
    //     next()
    // })
    userMap[socket.request.session.passport.user] = socket.id
    socketMap[socket.id] = socket.request.session.passport.user
    console.log(socketMap[socket.id] + ' has been connected')

    // console.log(socket.request.sessionID)
    // console.log(socket.request.session.passport.user)

    // socket.use('chat',(packet,next)=>{

    var timestamp = null

    // socket.use((packet, next) => {

    //     next();
    // })

    socket.on('room.list', () => {
        socket.emit('room.list.response', rooms);
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
    socket.on('disconnect', () => {
        let currRoomId = profiles[socketMap[socket.id]].status;
        // if this socket is in a room, need to leave it as well        
        if (currRoomId) {
            rooms[currRoomId].roomCnt--;
            profiles[socketMap[socket.id]].status = 0;
            io.to(currRoomId).emit('system.farewell', { packet: socketMap[socket.id], timestamp: timestamp })
        }
        console.log(socketMap[socket.id] + ' has been disconnected');
    })
})