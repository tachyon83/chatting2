// const path = require('path'); // OS-independent
const http = require('http');
const morgan = require('morgan')
const express = require('express');
// const session = require('express-session');
// const cookieParser = require('cookie-parser')
const passport = require('passport');
const passportConfig = require('./config/passportConfig');
// const webSettings = require('./config/webSettings')(session)
const webSettings = require('./config/webSettings')
const errorHandler = require('./utils/errorHandler')
const cors = require('cors');
const app = express();
app.use(morgan('short'))

app.use(express.json())
app.set('port', process.env.PORT || 3005);
app.use(webSettings.sessionRedisMiddleware)
// app.use(session(webSettings.sessionRedisSettings))
// app.use(cookieParser()) // cookieParser adds cookies to req.
// important: this [cors] must come before Router
app.use(passport.initialize());
app.use(passport.session());
// cors called after session and passport
app.use(cors(webSettings.corsSettings));
passportConfig()

const sessionToSocket = require('./utils/sessionToSocket')

const server = http.createServer(app);
const socketio = require('socket.io');
// const io = socketio.listen(server, webSettings.socketSettings);
const io = socketio(server, webSettings.socketSettings);

io.use((socket, next) => {
    // this is just damn important!
    console.log('[index]: right before sessionRedisMiddleware')
    webSettings.sessionRedisMiddleware(socket.request, socket.request.res || {}, next);
    // console.log('right after sessionRedisMiddleware', socket.request.session.id)
    // require('./controllers/socketioEntry')(io)
})
// require('./controllers/socketioEntry')(io)

io.on('connection', async socket => {

    console.log('right after sessionRedisMiddleware', socket.request.session.id)
    console.log('[index]: A New Socket Connected!')
    // console.log('[index]: Session ID in this Socket:', socket.request.session.id)
    // console.log('[IO]: Socket ID:', socket.id)
    console.log()
    // console.log('[index]: right before sessionRedisMiddleware')
    // webSettings.sessionRedisMiddleware(socket.request, socket.request.res || {}, next);
    // console.log('right after sessionRedisMiddleware', socket.request.session.id)
    console.log('[index]: Session ID in this Socket:', socket.request.session.id)
    console.log('[index]: Socket ID:', socket.id)

    await sessionToSocket(socket.request.session.id, socket)
    console.log('finding userId registered in this socket', socket.userId)
})


app.use((req, res, next) => {
    console.log()
    // console.log('[Current Session ID]:', req.session.id)
    let currTime = new Date();
    let timeStamp = currTime.getHours() + ':' + currTime.getMinutes();
    console.log('[HTTP CALL]:', timeStamp)
    // console.log('req.cookies', req.cookies)
    console.log('[Cookie]:', req.headers.cookie)
    console.log('[Session_ID]:', req.session ? req.session.id : 'no session yet')
    next()
})
// app.use('/user', webSettings.sessionRedisMiddleware, require('./routes/user')(io));
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
    console.log('check cors, path, method...etc')
    console.log(err)
    console.log()
    res.json(errorHandler(err))
});


server.listen(app.get('port'), () => {
    console.log('http://localhost:%d', app.get('port'));
});
