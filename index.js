// onlineUsers로 내려받아서 관리하고, 
// 일정 주기로 DB에 업뎃하는 방식
// onlineUsers가 Redis로 관리되어야 하는 대표적인 형태

var rooms = require('./models/rooms')
var roomsCnt = {
    cnt: Object.keys(rooms).length + 1
}
var users = require('./models/users').users
const addNewUser = require('./models/users').addNewUser

// 0번방은 없다
var roomUsers = {
    1: {},
    2: {},
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


// [방 나가기 함수]는 세션종료를 의미하지 않는다.
// 소켓도 끊지 않는다.
// 방을 나가는 과정만 관리한다.
const roomLeaveProcess = user => {
    return new Promise((resolve, reject) => {

        console.log(onlineUsers[user])

        let userSocketId = onlineUsers[user].socketId
        let currRoom = onlineUsers[user].status
        // onlineUsers[user].status = (currRoom === 0) ? -1 : 0
        onlineUsers[user].status = 0
        if (currRoom === 0) {
            // delete onlineUsers[user]
            // onlineUsersCnt.cnt--;
            console.log('this user was in lobby')
            resolve();
            return
        }

        console.log('this user was in a room')
        io.sockets[userSocketId].leave(currRoom, () => {
            /*
                방을 선택하지 않았어도 대기실(0번방)에는 첫 시작에 join한다
                그래서 항상 leave할 수 있다.
    
                roomUsers안에는 0번방이 없다.
                현재 0번방이면 나가는 처리 없이 바로 리턴한다.
                프론트로 보내주는 유저리스트는 onlineUsers이고,
                방에 있는 유저에게 보내는 유저리스트는 roomUsers[roomId]
                대기실에 있는 유저에게 보내는 방 리스트는 rooms
    
                cases:
                    그룹이...있구나...
                    - 방에 혼자있었을 경우 (해당 소켓은 자동으로 방장이란 뜻)
                    - 방에 혼자가 아닌 경우:
                        - 자신이 방장
                        - 자신은 방장이 아님
    
            */

            // if (currRoom != 0) {
            if (rooms[currRoom].roomCnt == 1) {
                // 아직 유저정보에 타이틀/직위(방장)에 관한 정보는 없다.
                delete rooms[currRoom]
                delete roomUsers[currRoom]
                roomsCnt.cnt--
            } else {
                delete roomUsers[currRoom][user]
                rooms[currRoom].roomCnt--
                if (rooms[currRoom].roomOwner == user) {
                    // 위에서 roomUsers에서 기존 방장은 삭제했기에 바로 다음 사람으로 위임 가능
                    for (let nextPerson in roomUsers[currRoom]) {
                        rooms[currRoom].roomOwner = nextPerson
                        break
                    }
                }
            }
            // }
            resolve()
        })
    })
}

// 회원가입시에 users에 등록했을테니
// 로그인시에는 users에 빼온다, 그리고 users에서 status변경
const signInProcess = user => {

    // socket.name and socket.join are handled in socket.io middleware

    console.log('user in signInProcess', user)
    console.log(users[user].status)
    onlineUsers[user] = users[user]
    onlineUsers[user].status = 0
    onlineUsersCnt.cnt++;
}

// 아래의 함수는 소켓이 끊어질 때만 불리는 함수다.
// 로그아웃을 통해 이 함수를 부르는 것이 아니다.
// 로그아웃이 버튼이 눌리면 프론트에서 manually 소켓을 끊어주게 되고,
// 소켓이 끊어지는 이벤트에서 아래 함수가 호출된다.
const signOutProcess = user => {

    // 여기서 먼저 소켓 관련 처리도 마무리해주고,
    // 소켓이벤트에서는 해당 property 존재 여부 확인 후 처리한다.

    /*
        variables to be concerned:
            rooms
            roomsCnt.cnt
            users
            roomUsers
            onlineUsers
            onlineUsersCnt
            
            socket (leave & disconnect)
            session?
    */

    // roomLeaveProcess(user)
    onlineUsers[user].socketId = null
    delete onlineUsers[user]
    onlineUsersCnt.cnt--;

}

const checkIfAlreadySignedIn = (req, res, next) => {

    /*
        checkIfAlreadySignedIn 에서 아래 사항 처리
            현재 로그인되어있는지 확인
            
            ! 로그인되어있다면 이전 소켓을 끊어버리고,
            있던 곳으로 그대로 이동시키기.

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
            roomNumber: null,
        })
    }
    let user = (req.session.passport) ? req.session.passport.user : null
    // let roomNumber = 0

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
    // if (req.session.passport) {

    console.log('user inside checkif', user)
    console.log('passport inside checkif', req.session.passport)
    console.log('onlineUsers inside checkif', onlineUsers[user])
    if (req.session.passport && onlineUsers[user]) {

        console.log('this session has passport', req.session.hasOwnProperty('passport'))
        console.log('this req has already been authenticated')
        user = req.session.passport.user
        roomNumber = onlineUsers[user].status
        console.log('user: ', user)
        // io.sockets[onlineUsers[user].socketId].disconnect()

        io.to(onlineUsers[user].socketId).emit('manualDisconnectByServer')
        // 해당 소켓 끊고 프론트로 정보 보내기
        // 현 세션에 다시 붙여주고 (같은 브라우저 내의 새 탭이었다면, 그냥 떼었다 붙이기...?)

        console.log('manual disconnect order emitted')

        io.on('manualDisconnectionComplete', () => {
            console.log('received manual ---complete')
            signInProcess(user)
            req.session.currRoom = roomNumber

            res.locals.basicInfo = {
                basicInfo: JSON.stringify({
                    userId: user,
                    rooms: rooms,
                    roomNumber: roomNumber,
                })
            }
            res.render('chatLobby', res.locals.basicInfo)
        })
        return

        // signInProcess(user)
        // req.session.currRoom = roomNumber

        // res.locals.basicInfo = {
        //     basicInfo: JSON.stringify({
        //         userId: user,
        //         rooms: rooms,
        //         roomNumber: roomNumber,
        //     })
        // }
        // res.render('chatLobby', res.locals.basicInfo)
        // return

        //     if (onlineUsers.hasOwnProperty(user)) {
        //         res.locals.basicInfo={
        //             basicInfo:JSON.stringify({
        //                 userId:user,
        //                 rooms:rooms,
        //                 roomNumber:roomNumber,
        //             })
        //         }
        //         if (onlineUsers[user].status != 0) {
        //             res.locals.basicInfo = {
        //                 basicInfo: JSON.stringify({
        //                     userId: user,
        //                     roomNumber: onlineUsers[user].status,
        //                 })
        //             }
        //             res.render('index', res.locals.basicInfo)
        //         } else {
        //             res.locals.basicInfo = {
        //                 basicInfo: JSON.stringify({
        //                     userId: user,
        //                     rooms: rooms,
        //                 })
        //             }
        //             res.render('chatLobby', res.locals.basicInfo)
        //         }
        //         return
        //         // 위에서 index나 lobby로 이동을 시켜주어야 한다. next()가
        //         // 다를 수 있기 때문.
        //     } else {
        //         res.locals.basicInfo = {
        //             basicInfo: JSON.stringify({
        //                 userId: user,
        //                 rooms: rooms,
        //             })
        //         }
        //     }
    } else {
        res.locals.basicInfo = {
            basicInfo: JSON.stringify({
                userId: user,
                rooms: rooms,
                roomNumber: 0,
            })
        }
    }
    next();
}

// router.get('/', checkIfAlreadySignedIn, (req, res) => {
//     res.render('index', res.locals.basicInfo)
// })

router.get('/', (req, res) => {

    // 다른 세션에서 접근해서 로그인했을 때,(로그인을 성공했으니)
    // 기존 로그인이 있었다면, 로비페이지로 가는게 맞다.<-아니다! 수정필요
    // 로그인 성공 후 기존 로그인이 있었다면 여기로 다시 온다
    // 그러므로 여기서도 동일 세션일 시 로비페이지로 이동한다.

    // res.locals.basicInfo = {
    //     basicInfo: {
    //         userId: null,
    //         rooms: rooms,
    //         alreadySignedIn:false,
    //     }
    // }

    if (req.session.passport && onlineUsers[req.session.passport.user]) {

        // let basicInfo = JSON.stringify({
        //     userId: req.session.passport.user,
        //     roomNumber: 'roomNumber Not Necessary?',
        // })
        // res.locals.basicInfo
        res.render('index', { user: req.session.passport.user })
        return;
    }
    res.render('index', { user: null })
})

router.post('/user/signin', passport.authenticate('local', {
    failureRedirect: '/',
    failureFlash: true
}), (req, res, next) => {
    console.log('right after serialization, passport?', req.session.hasOwnProperty('passport'))
    // 여기서 다른 세션에서 왔으니 기존 소켓 끊어주기 필요
    next()
}, (req, res) => {

    console.log('came from serialization maybe?')
    console.log('session ID', req.session.id)
    console.log('passport after router.post(profile.signin),passport.authenticate', req.session.passport)
    console.log(res.locals.basicInfo)

    let user = req.session.passport.user

    res.locals.basicInfo = {
        basicInfo: JSON.stringify({
            userId: user,
            rooms: rooms,
            alreadySignedIn: (onlineUsers[user]) ? true : false,
        })
    }
    if (onlineUsers[user]) {
        // res.render('index', res.locals.basicInfo)
        res.redirect('/')
        return;
    }
    req.session.save(() => {
        signInProcess(user)
        console.log('onlineUsers', onlineUsers)
        console.log('passport in session.save', req.session.passport)
        res.render('chatLobby', res.locals.basicInfo)
    })
})

router.post('/user/signup', (req, res) => {
    let username = req.body.username
    let password = req.body.password

    if (users.hasOwnProperty(username)) res.redirect('/')

    bcrypt
        .genSalt(saltRounds)
        .then(salt => {
            return bcrypt.hash(password, salt)
        })
        .then(hash => {
            users[username] = addNewUser(username, hash)
            // console.log('inside index users', users)
            // res.redirect('/')
            res.render('index', { user: null })
        })
        .catch(err => console.error(err.message))
})

router.get('/user/resignin/:user', (req, res) => {
    let user = req.params.user
    let socketId = onlineUsers[user].socketId
    let socket = io.sockets.connected[socketId]
    let socketSession = (socket.request.session.id == req.session.id) ? null : socket.request.session

    res.locals.basicInfo = {
        basicInfo: JSON.stringify({
            userId: user,
            rooms: rooms,
            roomNumber: 0,
        })
    }
    console.log('resignin process on going')

    roomLeaveProcess(user).then(_ => {
        socket.disconnect();
        // onlineUsers[user].socketId = null
        if (socketSession) {
            socketSession.destroy(_ => {
                res.render('chatLobby', res.locals.basicInfo)
            })
        } else res.render('chatLobby', res.locals.basicInfo)
    })
})

router.get('/user/signout/:user', (req, res) => {
    let user = req.params.user
    console.log(user)
    let socketId = onlineUsers[user].socketId
    let socket = io.sockets.connected[socketId]
    let session = req.session
    let socketSession = socket.request.session

    roomLeaveProcess(user).then(_ => {
        console.log('roomLeaveProcess done')
        signOutProcess(user)
        socket.disconnect();
        console.log('socket disconnected')
        // console.log(socket)
        req.session.destroy(_ => {
            if (session.id != socketSession.id) socketSession.destroy(_ => {
                res.render('index', { user: null })
            })
            else res.render('index', { user: null })
        })
    })
})

router.get('/user/signuppage', (req, res) => {
    res.render('signup')
})

// router.get('/onlineUsers/list', (req, res) => {
//     res.json(io.sockets.connected)
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
// function middleware(req,res,next){
//     if(req.isAuthenticated())return next();
//     res.sendFile(__dirname + '/html/signin.html');
// }

const server = http.createServer(app);
server.listen(app.get('port'), () => {
    console.log('http://localhost:%d', app.get('port'));
});

const socketio = require('socket.io');
// const { resolve } = require('path')
// const { json } = require('express')
const io = socketio.listen(server);

watch(roomsCnt, () => {
    console.log('watched: a new room made')
    // console.log('io.in(0)', io.in(0))
    io.to(0).emit('room.list.response', rooms)
    console.log('maybe emitted')
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
        console.log('socket.req.session.id', socket.request.session.id)
    })
    next();
})

var timestamp = null;

io.on('connection', socket => {
    socket.name = socket.request.session.passport.user
    console.log('now name attached', socket.name)
    onlineUsers[socket.name].socketId = socket.id

    socket.use((packet, next) => {
        let currTime = new Date();
        timestamp = currTime.getHours() + ':' + currTime.getMinutes();
        // if (socket.request.session.passport) return next();
        // socket.disconnect();
        // console.log('this session is expired')
        next()
    })
    // console.log('userMap', userMap)
    // console.log('socket.req.session', socket.request.session)

    // socket.name might be able to replace socketMap
    console.log('socket.name', socket.name)
    // userMap[socket.request.session.passport.user] = socket.id
    // socketMap[socket.id] = socket.request.session.passport.user
    // socket.join(socket.request.session.currRoom, () => {
    socket.join(0, () => {
        // rooms[0].roomCnt = io.sockets.adapter.rooms[0].length
        // users[socketMap[socket.id]].status = 0;
        console.log('joined')
        // console.log('io.sockets', io.sockets)
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

    socket.on('manualDisconnectByServer', () => {

        console.log('manual disconnect order received')

        let disconnectedUser = socket.request.session.passport.user
        signOutProcess(disconnectedUser)
        console.log(disconnectedUser + ' has been disconnected');
        io.emit('manualDisconnectionComplete')

        // 다른 브라우저로 새로운 세션을 만들어 들어왔을 때,
        // 기존 소켓이 끊어지고, 세션이 남는것인지? 그렇다면 그 남은 세션이 
        // 누적되었을 때 발생할 수 있는 문제는...?


    })
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
