const url = require('url');
const http = require('http');
const static = require('serve-static');
const express = require('express');
const session = require('express-session');
// const redis = require('./redis')
// const RedisStore = require("connect-redis")(session);
const passport = require('passport');
const passportConfig = require('./passportTest');
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt');
// important: this [cors] must come before Router
const cors = require('cors');
const flash = require('connect-flash')
const router = express.Router();
const app = express();
const socketio = require('socket.io')
// const path = require('path');
var rooms = require('./models/rooms')
var profiles = require('./models/profiles')

app.use(session({ secret: 'secret secretary', resave: true, saveUninitialized: false }))
// app.use(session({
//     store:new RedisStore({
//         client:redis,
//         host:'localhost',
//         port:6379,
//         prefix:'session',
//         db:0,
//         saveUninitialized:false,
//         resave:false
//     }),
//     secret:'secret secretary',
//     cookie:{maxAge:100000},
// }))
app.use(passport.initialize());
app.use(passport.session());
app.use(flash())
passportConfig();

// app.use('/', static(__dirname + '/html/'));
app.set('port', process.env.PORT || 3000);
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

app.get('/', function (req, res) {
    // res.sendFile(path.join(__dirname + '/html/chat.html'));
    res.sendFile(__dirname + '/html/signin.html');
    // console.log(__dirname)
    // res.sendFile(__dirname + '/html/index.html');
})

// app.get('/', function (req, res) {
//     if (req.session.key) {
//         res.redirect('/')
//     } else {
//         res.redirect('/html/signin.html')
//     }
// })

router.route('/').get((req, res) => {
    // res.sendFile(__dirname + '/html/signin.html');
    res.sendFile(__dirname + '/html/index.html');
    // res.redirect('/signin.html')
})

// chat messages, log-in & out logs
// friend list, group list, room list
// person info (id,chat_room_id, room, group, level )

var chatLogs = {};
var messages = [];

router.post('/profile/signin', passport.authenticate('local', {
    failureRedirect: '/profile/failure'
}), (req, res) => {
    req.session.save(function () {
        console.log(req.user)
        // socket._id = req.user._id;
        res.redirect('/profile/success');
    })
})
router.route('/profile/signout').get((req, res) => {
    req.logout();
    req.session.save(function () {
        res.redirect('/');
    })
})
router.route('/profile/success').get((req, res) => {
    if (req.isAuthenticated()) res.sendFile(__dirname + "/html/index.html")
})
router.route('/profile/failure').get((req, res) => {
    res.sendFile(__dirname + "/html/signin.html")
})

// router.route('/room/list').get((req, res) => {
//     res.end(JSON.stringify({ rooms: rooms }));
// });

// router.route('/room/join/:roomID/:pID').get((req, res) => {
//     var selectedRoomID = req.params.roomID;
//     var pID = req.params.pID;

//     // personal socket
//     // 접속하는 순간부터 소켓으로 모든 이벤트 관리해야할듯...?

//     res.redirect('/chat.html');
// })

app.use('/', router);
const server = http.createServer(app);
server.listen(app.get('port'), () => {
    console.log('http://localhost:%d', app.get('port'));
});
const io = socketio.listen(server);

// const sessionMiddleware = session({
//     store: new RedisStore({
//         host: 'localhost',
//         port: 6379,
//         client: client,
//         ttl: 260,
//     }),
//     secret: "secret cat",
// })
// io.use(function (socket, next) {
//     sessionMiddleware(socket.request, socket.request.res || {}, next);
// })
// app.use(sessionMiddleware);
// app.get('/', function (req, res) {
//     req.session
// })

io.on('connection', (socket) => {

    console.log('a user connected');
    // profiles[socket]

    socket.on('room.list', () => {
        // console.log('room.list called')
        socket.emit('room.list.response', rooms);
    })

    socket.on('room.join', roomDTO => {
        const targetId = roomDTO.roomID
        const target = rooms[targetId]
        // capacity만 지정,
        // 현재 인원은 소켓에서 가져옴 

        if (target.roomCnt < target.roomCapacity && (!io.sockets.adapter.rooms[targetId] || !io.sockets.adapter.rooms[targetId].sockets[socket.id])) {
            // if (target.roomCnt < target.roomCapacity && !io.sockets.adapter.rooms[targetId].sockets[socket.id]) {
            socket.emit('room.join.response', true);
            // roomCnt등에 synchronized처리
            // 그 외에도 sync처리 부분 확인필요
            // rooms[roomDTO.roomID].roomCnt++;
            // profiles[socket.pID].pRoomID = roomToJoin.roomID;
            // socket.join(room[roomToJoin.roomID], () => {
            socket.join(targetId, () => {
                rooms[targetId].roomCnt = io.sockets.adapter.rooms[targetId].length
                // io.sockets.to(targetId).emit('system.invite', socket);
                io.to(targetId).emit('system.invite', socket.id);
            });
        } else socket.emit('room.join.response', false);
    })
    socket.on('chat.public', chatDTO => {
        // messages.push({ 'name': msg.name, 'message': msg.txt });
        let currRoom = null;
        for (var key of Object.keys(socket.rooms)) if (key != socket.id) currRoom = key
        io.to(currRoom).emit('chat.public', chatDTO);
    })
    socket.on('disconnect', () => {
        console.log('this user disconnected');
        io.emit('leave');
    })
})