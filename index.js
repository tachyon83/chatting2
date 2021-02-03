// const path = require('path'); // OS-independent
const http = require('http');
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

app.use(express.json())
app.set('port', process.env.PORT || 3000);
app.use(webSettings.sessionRedisMiddleware)
// app.use(session(webSettings.sessionRedisSettings))
// app.use(cookieParser()) // cookieParser adds cookies to req.
// important: this [cors] must come before Router
app.use(passport.initialize());
app.use(passport.session());
// cors called after session and passport
app.use(cors(webSettings.corsSettings));
passportConfig()

const server = http.createServer(app);
const socketio = require('socket.io');
// const io = socketio.listen(server, webSettings.socketSettings);
const io = socketio(server, webSettings.socketSettings);
io.use((socket, next) => {
    // this is just damn important!
    webSettings.sessionRedisMiddleware(socket.request, socket.request.res || {}, next);
})
require('./controllers/socketioEntry')(io)


app.use((req, res, next) => {
    console.log()
    console.log('[Current Session ID]: ', req.session.id)
    let currTime = new Date();
    let timeStamp = currTime.getHours() + ':' + currTime.getMinutes();
    console.log('[HTTP CALL]: ', timeStamp)
    console.log('req.cookies', req.cookies)
    console.log(req.headers.cookie)
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
    console.log(err)
    console.log()
    res.json(errorHandler(err))
});


server.listen(app.get('port'), () => {
    console.log('http://localhost:%d', app.get('port'));
});
