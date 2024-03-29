// const path = require('path'); // OS-independent
const http = require('http');
const morgan = require('morgan')
const express = require('express');
// const session = require('express-session');
// const cookieParser = require('cookie-parser')
const passport = require('passport');
const passportConfig = require('./config/passportConfig');
const webSettings = require('./config/webSettings')
const errorHandler = require('./utils/errorHandler')
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server, webSettings.socketSettings)
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next)

app.use(morgan('short'))
app.use(express.json())
app.set('port', process.env.PORT || 3005);

app.use(webSettings.sessionRedisMiddleware)
io.use(wrap(webSettings.sessionRedisMiddleware))
// app.use(cookieParser()) // cookieParser adds cookies to req.

// important: this [cors] must come before Router
app.use(passport.initialize());
app.use(passport.session());
// cors called after session and passport
app.use(cors(webSettings.corsSettings));
passportConfig()

// const server = http.createServer(app);
// const socketio = require('socket.io');
// const io = socketio.listen(server, webSettings.socketSettings)
// const io = socketio(server, webSettings.socketSettings)
// let sharedSession = require('express-socket.io-session')
// io.use(sharedSession(webSettings.sessionRedisMiddleware, { autoSave: true }))

require('./controllers/socketioEntry')(io)

// io.use((socket, next) => {
//     require('./controllers/socketioEntry')(io)
//     // this is just damn important!
//     webSettings.sessionRedisMiddleware(socket.request, socket.request.res || {})
// })

app.use((req, res, next) => {
    console.log()
    let currTime = new Date();
    let timeStamp = currTime.getHours() + ':' + currTime.getMinutes();
    console.log('[HTTP timestamp]:', timeStamp)
    // console.log('req.cookies', req.cookies)
    console.log('[Cookie in headers]:', req.headers.cookie)
    console.log('[Session_ID]:', req.session ? req.session.id : 'no session yet')
    next()
})
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
