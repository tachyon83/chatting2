// important: this [cors] must come before Router
const cors = require('cors');
// const events = require('events')
const app = require('express')()
app.set('port', process.env.PORT || 3000);
app.use(cors());

// const eventEmitter = new events.EventEmitter()
const evTester = require('./index2test')

const redisClient = require('./config/redisClient')
redisClient.hkeys('testHm', (err, keys) => {
    if (err) return console.log(err)
    // if (!keys.length) console.log('hkeys', keys)
    console.log('hkeys', keys)
})
redisClient.rpush('testList', 1)
redisClient.rpush('testList', 1)
redisClient.rpush('testList', 1)
redisClient.rpush('testList', 1)
redisClient.rpush('testList', 1)
redisClient.rpush('testList', 1)
redisClient.rpush('testList', 1)
redisClient.rpush('testList', 1)
redisClient.lrange('testList', 0, 5, (err, list) => {
    if (err) console.log(err)
    console.log(list)
})
redisClient.lrange('test111', 0, 15, (err, list) => {
    if (err) console.log('test111 err', err)
    console.log('test111 list', list)
})

redisClient.llen('chatLog', (err, len) => {
    if (err) return console.log(err)
    console.log('len', len)
    if (!len) return console.log(len)
    redisClient.lrange('chatLog', 0, 5 - 1, (err, list) => {
        if (err) return console.log(err)
        redisClient.ltrim('chatLog', 5, -1)
        console.log(list)
    })
})


const eventHandler = () => {
    redisClient.smembers('testSet', (err, members) => {
        if (err) console.log(err)
        console.log(members)
    })
}
evTester.evEmitter.on('test123', eventHandler)
evTester.tester()

const server = require('http').createServer(app);
// const io = require('socket.io').listen(server);
const io = require('socket.io')(server, {
    pingTimeout: 600000,
})

io.use((socket, next) => {
    console.log('io middleware1')
    next();
})

io.on('connection', socket => {
    console.log('a new socket is connected: ', socket.id)

    // socket.use((packet, next) => {
    //     console.log('socket middleware1')
    //     next()
    // })

    let testdata = {
        num: 3,
        tit: '제목이당',
        own: '방장장',
        userNowNum: 1,
        userNum: 3
    }
    socket.emit('test', testdata)
    console.log('maybe emitted?')

    socket.on('from.client', data => {
        console.log(data)
    })
    socket.on('from.client2', data => {
        console.log('pong')
    })
    socket.on('disconnect', reason => {
        console.log('reason: ', reason)
        if (reason === 'transport close') console.log('client side has disconnected this socket')
        else console.log('somehow disconnected', socket.id)
    })
})
server.listen(app.get('port'), () => {
    console.log('http://localhost:%d', app.get('port'));
});