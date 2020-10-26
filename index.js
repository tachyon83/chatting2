const url = require('url');
const http = require('http');
const static = require('serve-static');
const express = require('express');
const session = require('express-session');
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
app.use(session({ secret: 'secret secretary', resave: true, saveUninitialized: false }))
app.use(passport.initialize());
app.use(passport.session());
app.use(flash())
passportConfig();

// app.use('/', static(__dirname + '/html/'));
app.set('port', process.env.PORT || 3000);
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

// app.get('/', function (req, res) {
//     // res.sendFile(path.join(__dirname + '/html/chat.html'));
//     // res.sendFile(__dirname + '/html/signin.html');
//     console.log(__dirname)
//     res.sendFile(__dirname + '/html/index.html');
// })
router.route('/').get((req, res) => {
    res.sendFile(__dirname + '/html/signin.html');
    // res.redirect('/signin.html')
})

// chat messages, log-in & out logs
// friend list, group list, room list
// person info (id,chat_room_id, room, group, level )


var profiles = {};
var signinIDs = {};
var rooms = {
    1: {
        roomID: 1,
        roomPW: null,
        roomTitle: '조용한 방',
        roomCnt: 4,
        roomCapacity: 8,
        roomOwner: '홍길동'
    },
    2: {
        roomID: 2,
        roomPW: null,
        roomTitle: '시끄러운 방',
        roomCnt: 2,
        roomCapacity: 20,
        roomOwner: '시끌이'
    },
    3: {
        roomID: 3,
        roomPW: null,
        roomTitle: '말많은 방',
        roomCnt: 1,
        roomCapacity: 5,
        roomOwner: '수다쟁이'
    }
}

var chatLogs = {};
var messages = [];

// router.route('/profile/signin').post((req, res) => {

//     var authenticated = false;

//     // later, need a fix to actually authenticate the user
//     var userKey = req.body.pID;
//     // var user = {
//     //     pID: req.body.pID,
//     //     pPW: req.body.pPW,
//     //     pNick: req.body.pNick
//     // }
//     var user = req.body;
//     // if (user.pID != null) {
//     //     if (profiles.length == 0 || !profiles.hasOwnProperty(userKey)) {
//     //         user.pGroup = null;
//     //         user.pRoomID = null;
//     //         profiles[userKey] = user;
//     //     }
//     //     // console.log('profiles', profiles)
//     //     // dot뒤의 문자는 문자열로 받아들여진다(변수명 사용불가)
//     //     if (profiles[userKey].pPW == user.pPW) authenticated = true;
//     // }
//     // if (authenticated === true) {
//     //     res.redirect(url.format({
//     //         pathname: '/roomlist.html',
//     //         query: { pID: user.pID }
//     //     }))
//     // }
//     // else res.redirect('/signin.html');
// });

// in case you want to use your custom function
// be cautious that this code below does not work for OAuth
// router.post('/profile/signin',function(req,res,next){
//     passport.authenticate('local',function(err,user,info){
//         if(err)return next(err);
//         if(!user)return res.end(false);
//         // req.logIn(user,function(err){
//         //     if(err)return next(err);
//         //     return res.redirect('users/'+user.username);
//         // })
//         res.end(true);
//     })(req,res,next)
// })

// router.post('/profile/signin', passport.authenticate('local', {
//     failureRedirect: '../'
// }), (req, res) => {
//     res.redirect('/profile/success');
// })

router.post('/profile/signin', passport.authenticate('local', {
    failureRedirect: '/profile/failure'
}), (req, res) => {
    req.session.save(function () {
        console.log(req.user)
        // socket._id = req.user._id;
        res.redirect('/profile/success');
    })
})
router.route('/signout').get((req, res) => {
    req.logout();
    req.session.save(function () {
        res.redirect('/');
    })
})
router.route('/profile/success').get((req, res) => {
    res.sendFile(__dirname + "/html/index.html")
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

// router.route('')

// router.route('/send').get((req, res) => {
//     // console.log(req.query.whisperTo);
//     messages.push({ 'name': req.query.name, 'message': req.query.message, 'whisperTo': req.query.whisperTo });
//     // res.redirect('/chat.html');
// });
// router.route('/chatLogCheck/:sz/:name').get((req, res) => {
//     var name = req.params.name;
//     var sz = parseInt(req.params.sz);
//     var l = messages.length;
//     var data = '';
//     if (l == 0 || l <= sz) res.end();
//     else {
//         var slicedMessages = messages.slice(sz);
//         var filteredMessages = slicedMessages.filter(function (msg) {
//             return (msg.whisperTo == '' || msg.whisperTo == name)
//         })
//         if (filteredMessages.length != 0) {
//             data = {
//                 'size': l,
//                 'messages': filteredMessages,
//             };
//         }
//         res.end(JSON.stringify(data));
//     }
// });


app.use('/', router);
const server = http.createServer(app);
server.listen(app.get('port'), () => {
    console.log('http://localhost:%d', app.get('port'));

    // database.init(app,config);
});
var io = socketio.listen(server);
// io.use(function (socket, next) {
//     sessionMiddleware(socket.request, {}, next);
// })

io.on('connection', (socket) => {

    console.log('a user connected');

    socket.on('room.list', () => {
        // console.log('room.list called')
        socket.emit('room.list.response', rooms);
    })

    socket.on('room.join', roomDTO => {
        const roomToJoin = rooms[roomDTO.roomID];
        // console.log('roomToJoin', roomToJoin);

        // capacity만 지정,
        // 현재 인원은 소켓에서 가져옴 

        if (roomToJoin.roomCnt < roomToJoin.roomCapacity && (!io.sockets.adapter.rooms[roomToJoin.roomID] || !io.sockets.adapter.rooms[roomToJoin.roomID].sockets[socket.id])) {
            // console.log('now emitting')
            socket.emit('room.join.response', true);
            // roomCnt등에 synchronized처리
            // 그 외에도 sync처리 부분 확인필요
            rooms[roomDTO.roomID].roomCnt++;
            // profiles[socket.pID].pRoomID = roomToJoin.roomID;
            // socket.join(room[roomToJoin.roomID], () => {
            socket.join(roomToJoin.roomID, () => {
                console.log(io.sockets.adapter.rooms[roomToJoin.roomID])
                console.log(socket.id + ' joined ' + roomToJoin.roomID);
                // console.log(io.to(roomToJoin.roomID))
                io.to(roomToJoin.roomID).emit('newbie', socket.id);
                // console.log(io.sockets.adapter.rooms);
            });
            // console.log(io.sockets.adapter.rooms)
            // console.log(io.sockets.adapter)
            // io.to(io.adapter.rooms[roomToJoin.roomID]).emit('someone.joined');
        }
        socket.emit('room.join.response', false);
    })
    // socket.on('chat', (msg) => {
    //     messages.push({ 'name': msg.name, 'message': msg.txt });
    //     console.log(messages)
    //     io.emit('chat', msg);
    // })
    socket.on('disconnect', () => {
        console.log('this user disconnected');
        io.emit('leave');
    })
})