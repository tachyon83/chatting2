////////////////// data map //////////////////

// roomsUsers => redisClient.sadd('0',socket.userId)
// onlineUsers => redisClient.hmset('onlineUsers', {[userId]: JSON.stringify(user)})
// sessionMap => redisClient.hget('sessionMap', sessionId, (err, userId) => { })
// socket.userId, socket.pos

//////////////////////////////////////////////

// const path = require('path'); // OS-independent
const http = require('http');
const express = require('express');
const passport = require('passport');
const passportConfig = require('./config/passportConfig');
const webSettings = require('./config/webSettings')
const cors = require('cors');
const app = express();

app.use(express.json())
app.set('port', process.env.PORT || 3000);
// important: this [cors] must come before Router

app.use(webSettings.sessionRedisMiddleware)
app.use(cors(webSettings.corsSettings));
// app.use(cookieParser())
app.use(passport.initialize());
app.use(passport.session());
passportConfig()
// flash는 내부적으로 session을 이용하기 때문에 session 보다 아래쪽에서 미들웨어를 설치
// app.use(flash())

const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio.listen(server, {
    cors: {
        origin: true,
        credentials: true,
    }
});
io.use((socket, next) => {
    console.log('io middle=>socket.id: ', socket.id)
    // this is just damn important!
    webSettings.sessionRedisMiddleware(socket.request, socket.request.res || {}, next);
})
require('./controllers/socketio')(io)


app.use((req, res, next) => {
    let currTime = new Date();
    let timeStamp = currTime.getHours() + ':' + currTime.getMinutes();
    console.log('Server Call : ', timeStamp)
    // console.log(req.session.cookie)
    console.log(req.isAuthenticated())
    next()
})
app.use('/user', require('./routes/user')(io));

// chat messages, log-in & out logs
// friend list, group list, room list
// person info (id,chat_room_id, room, group, level )

server.listen(app.get('port'), () => {
    console.log('http://localhost:%d', app.get('port'));
});
