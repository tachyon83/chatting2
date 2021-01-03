// const path = require('path'); // OS-independent
const http = require('http');
const express = require('express');
const passport = require('passport');
const passportConfig = require('./config/passportConfig');
const webSettings = require('./config/webSettings')
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
// flash는 내부적으로 session을 이용하기 때문에 session 보다 아래쪽에서 미들웨어를 설치
// app.use(flash())

const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio.listen(server, webSettings.socketSettings);
io.use((socket, next) => {
    // console.log('io middle=>socket.id: ', socket.id)
    // this is just damn important!
    webSettings.sessionRedisMiddleware(socket.request, socket.request.res || {}, next);
})
require('./controllers/socketioEntry')(io)


app.use((req, res, next) => {
    let currTime = new Date();
    let timeStamp = currTime.getHours() + ':' + currTime.getMinutes();
    console.log('[HTTP CALL]: ', timeStamp)
    next()
})
app.use('/user', require('./routes/user')(io));

// catch 404 and forward to error handler
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
