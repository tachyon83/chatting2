const url = require('url');
const path = require('path'); // OS-independent
// const http = require('http');
const bodyParser = require('body-parser')
const static = require('serve-static');
const express = require('express');
const session = require('express-session');
var RedisStore = require("connect-redis")(session);
var redisClient = require('./redisTestClient');
const cors = require('cors');
// const router = express.Router();
const app = express();
const server = (require('http').Server)(app);
const io = require('socket.io')(server);
var sessionMiddleware = session({
    store: new RedisStore({
        client: redisClient,
        host: 'localhost',
        port: 6379,
        prefix: "session:",
        db: 0,
        saveUninitialized: false,
        resave: false
    }),
    secret: 'keyboard cat',
    // cookie: { maxAge: 2592000000 }
    cookie: { maxAge: 25920 }
})
io.use(function (socket, next) {
    sessionMiddleware(socket.request, socket.request.res || {}, next)
})
app.use(sessionMiddleware)
// app.use(session({
//     store: new RedisStore({
//         client: redisClient,
//         host: 'localhost',
//         port: 6379,
//         prefix: "session:",
//         db: 0,
//         saveUninitialized: false,
//         resave: false
//     }),
//     secret: 'keyboard cat',
//     // cookie: { maxAge: 2592000000 }
//     cookie: { maxAge: 25920 }
// }));
app.set('port', process.env.PORT || 3000);
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

app.get('/', function (req, res) {
    req.session
})
io.sockets.on('connection', function (socket) {
    socket.request.session
})

// app.get('/', (req, res) => {
//     if (req.session.key) res.redirect('/admin')
//     // else res.render('/index')
//     else res.sendFile(__dirname + '/redisLoginTest.html')
// })
// app.route('/login')
//     .get(function (req, res) {
//         if (req.session.key) res.redirect('/admin')
//         res.sendFile(__dirname + '/redisLoginTest.html')
//     })
//     .post(function (req, res) {
//         req.session.key = req.body.email
//         console.log('email', req.session.key)
//         res.end('done')
//     })
// app.get('/logout', (req, res) => {
//     req.session.destroy(function (err) {
//         if (err) console.log(err)
//         else res.redirect('/')
//     })
// })

// app.use('/', router);
// const server = http.createServer(app);
server.listen(app.get('port'), () => {
    console.log('http://localhost:%d', app.get('port'));
});
